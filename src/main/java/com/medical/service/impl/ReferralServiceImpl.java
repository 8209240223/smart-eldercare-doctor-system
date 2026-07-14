package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.dto.DoctorOptionView;
import com.medical.entity.ElderInfo;
import com.medical.entity.ReferralOrder;
import com.medical.entity.SysUser;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.PatientHandoffMapper;
import com.medical.mapper.ReferralOrderMapper;
import com.medical.message.service.MessageService;
import com.medical.service.DoctorNurseRelationService;
import com.medical.service.DoctorProfileService;
import com.medical.service.ReferralService;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ReferralServiceImpl implements ReferralService {
    private static final String PLATFORM_ORG = "智慧医养医生服务系统";

    private final ReferralOrderMapper referralOrderMapper;
    private final PatientHandoffMapper patientHandoffMapper;
    private final TimelineService timelineService;
    private final DoctorProfileService doctorProfileService;
    private final DoctorNurseRelationService relationService;

    @Autowired(required = false)
    private MessageService messageService;

    public ReferralServiceImpl(ReferralOrderMapper referralOrderMapper,
                               PatientHandoffMapper patientHandoffMapper,
                               TimelineService timelineService,
                               DoctorProfileService doctorProfileService,
                               DoctorNurseRelationService relationService) {
        this.referralOrderMapper = referralOrderMapper;
        this.patientHandoffMapper = patientHandoffMapper;
        this.timelineService = timelineService;
        this.doctorProfileService = doctorProfileService;
        this.relationService = relationService;
    }

    @Override
    @Transactional
    public ReferralOrder createReferral(ReferralOrder order, Long currentUserId, Integer currentUserType) {
        requireDoctor(currentUserId, currentUserType);
        if (order == null || order.getElderId() == null) {
            throw new BusinessException(400, "请选择需要移交的老人");
        }
        if (!StringUtils.hasText(order.getReferralReason())) {
            throw new BusinessException(400, "请填写患者移交原因");
        }

        SysUser fromDoctor = doctorProfileService.requireActiveDoctor(currentUserId);
        SysUser toDoctor = doctorProfileService.requireActiveDoctor(order.getToDoctorId());
        if (currentUserId.equals(toDoctor.getId())) {
            throw new BusinessException(400, "接收医生不能与当前责任医生相同");
        }

        ElderInfo elder = patientHandoffMapper.selectElderForUpdate(order.getElderId());
        if (elder == null) {
            throw new BusinessException(404, "老人不存在或已删除");
        }
        if (!currentUserId.equals(elder.getDoctorId())) {
            throw new BusinessException(403, "只能移交自己当前负责的老人");
        }
        if (Integer.valueOf(0).equals(elder.getAccountStatus())) {
            throw new BusinessException(400, "老人账号已停用，不能发起移交");
        }

        Long activeCount = referralOrderMapper.selectCount(new LambdaQueryWrapper<ReferralOrder>()
                .eq(ReferralOrder::getElderId, elder.getId())
                .in(ReferralOrder::getStatus, 0, 1, 2));
        if (activeCount != null && activeCount > 0) {
            throw new BusinessException(400, "该老人已有进行中的医生移交申请");
        }

        LocalDateTime now = LocalDateTime.now();
        order.setReferralNo("HANDOFF" + System.currentTimeMillis());
        order.setReferralType(1);
        order.setFromOrg(PLATFORM_ORG);
        order.setFromDoctorId(fromDoctor.getId());
        order.setFromDoctorName(displayName(fromDoctor));
        order.setFromDept(doctorProfileService.departmentOf(fromDoctor.getId()));
        order.setToOrg(PLATFORM_ORG);
        order.setToDoctorId(toDoctor.getId());
        order.setToDoctorName(displayName(toDoctor));
        order.setToDept(doctorProfileService.departmentOf(toDoctor.getId()));
        order.setBedReserved(0);
        order.setStatus(0);
        order.setCreateTime(now);
        order.setUpdateTime(now);
        referralOrderMapper.insert(order);

        TimelineEvent event = new TimelineEvent();
        event.setElderId(order.getElderId());
        event.setEventType(7);
        event.setEventTitle("医生间患者移交申请");
        event.setEventContent(displayName(fromDoctor) + "（" + order.getFromDept() + "）申请移交给"
                + displayName(toDoctor) + "（" + order.getToDept() + "），原因：" + order.getReferralReason());
        event.setSourceType("referral");
        event.setSourceId(order.getId());
        event.setDoctorId(fromDoctor.getId());
        event.setEventTime(now);
        timelineService.addEvent(event);

        notifyReferralUsers(order, fromDoctor.getId(), "收到新的患者移交申请",
                "你收到一条患者移交申请，请进入医生协作页面处理。", 2);
        return order;
    }

    @Override
    @Transactional
    public void acceptReferral(Long id, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = requireOrder(id);
        assertPermission(order, currentUserId, currentUserType, "接收", true);
        assertStatus(order, Set.of(0), "接收");
        requireTransferableElder(order);
        order.setStatus(1);
        order.setAcceptTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
        notifyReferralUsers(order, currentUserId, "患者移交申请已接收",
                "接收医生已确认接收，完成操作后患者归属和未完成任务将整体迁移。", 1);
    }

    @Override
    @Transactional
    public void completeReferral(Long id, String handoffSummary, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = requireOrder(id);
        assertPermission(order, currentUserId, currentUserType, "完成移交", true);
        assertStatus(order, Set.of(1, 2), "完成移交");
        if (!StringUtils.hasText(handoffSummary)) {
            throw new BusinessException(400, "请填写患者接收与后续安排");
        }

        ElderInfo elder = requireTransferableElder(order);
        Long toNurseId = relationService.chooseNurseForDoctor(
                order.getToDoctorId(), String.valueOf(elder.getId()), elder.getNurseId());

        patientHandoffMapper.transferOpenWarnings(elder.getId(), order.getToDoctorId());
        patientHandoffMapper.transferActiveFollowPlans(elder.getId(), order.getToDoctorId());
        patientHandoffMapper.transferOpenFollowupTasks(elder.getId(), order.getToDoctorId());
        patientHandoffMapper.transferActiveInterventions(elder.getId(), order.getToDoctorId());
        patientHandoffMapper.transferActiveNursingPlans(elder.getId(), order.getToDoctorId(), toNurseId);
        patientHandoffMapper.transferOpenNursingRecords(elder.getId(), order.getToDoctorId(), toNurseId);
        patientHandoffMapper.transferDraftReports(elder.getId(), order.getToDoctorId());

        order.setStatus(3);
        order.setDischargeSummary(handoffSummary.trim());
        order.setCompleteTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        if (referralOrderMapper.updateById(order) <= 0) {
            throw new BusinessException(500, "更新患者移交状态失败");
        }
        if (patientHandoffMapper.transferElderOwner(elder.getId(), order.getFromDoctorId(),
                order.getToDoctorId(), toNurseId) != 1) {
            throw new BusinessException(409, "患者责任医生已变化，请刷新后重试");
        }

        TimelineEvent event = new TimelineEvent();
        event.setElderId(order.getElderId());
        event.setEventType(7);
        event.setEventTitle("患者责任医生移交完成");
        event.setEventContent(order.getFromDoctorName() + " → " + order.getToDoctorName()
                + "；接收安排：" + handoffSummary.trim());
        event.setSourceType("referral");
        event.setSourceId(order.getId());
        event.setDoctorId(order.getToDoctorId());
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);

        notifyReferralUsers(order, currentUserId, "患者移交已完成",
                "患者档案、历史资料和未完成工作流已归属接收医生，原责任医生不再具有访问权限。", 2);
    }

    @Override
    @Transactional
    public void rejectReferral(Long id, String reason, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = requireOrder(id);
        assertPermission(order, currentUserId, currentUserType, "拒绝", true);
        assertStatus(order, Set.of(0, 1), "拒绝");
        requireTransferableElder(order);
        order.setStatus(4);
        order.setRejectReason(reason);
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
        notifyReferralUsers(order, currentUserId, "患者移交申请已拒绝",
                "接收医生拒绝了患者移交申请，请查看原因并重新协调。", 3);
    }

    @Override
    @Transactional
    public void cancelReferral(Long id, String reason, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = requireOrder(id);
        assertPermission(order, currentUserId, currentUserType, "取消", false);
        assertStatus(order, Set.of(0, 1), "取消");
        requireTransferableElder(order);
        order.setStatus(5);
        order.setCancelReason(reason);
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
        notifyReferralUsers(order, currentUserId, "患者移交申请已取消",
                "发起医生已取消本次患者移交申请。", 2);
    }

    @Override
    public Page<ReferralOrder> listReferrals(Integer pageNum, Integer pageSize, Long doctorId,
                                             Integer status, Integer referralType) {
        LambdaQueryWrapper<ReferralOrder> wrapper = new LambdaQueryWrapper<>();
        if (doctorId != null) {
            wrapper.and(item -> item.eq(ReferralOrder::getFromDoctorId, doctorId)
                    .or().eq(ReferralOrder::getToDoctorId, doctorId));
        }
        wrapper.eq(status != null, ReferralOrder::getStatus, status)
                .orderByDesc(ReferralOrder::getCreateTime);
        return referralOrderMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public ReferralOrder getDetail(Long id) {
        return requireOrder(id);
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", countByStatuses(0));
        stats.put("processing", countByStatuses(1, 2));
        stats.put("completed", countByStatuses(3));
        stats.put("total", referralOrderMapper.selectCount(new LambdaQueryWrapper<ReferralOrder>()));
        return stats;
    }

    @Override
    public List<DoctorOptionView> listTargetDoctors(Long currentUserId) {
        return doctorProfileService.listActiveDoctorOptions(currentUserId);
    }

    private long countByStatuses(Integer... statuses) {
        return referralOrderMapper.selectCount(new LambdaQueryWrapper<ReferralOrder>()
                .in(ReferralOrder::getStatus, (Object[]) statuses));
    }

    private ReferralOrder requireOrder(Long id) {
        ReferralOrder order = id == null ? null : referralOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException(404, "患者移交申请不存在");
        }
        return order;
    }

    private ElderInfo requireTransferableElder(ReferralOrder order) {
        ElderInfo elder = patientHandoffMapper.selectElderForUpdate(order.getElderId());
        if (elder == null) {
            throw new BusinessException(404, "老人不存在或已删除");
        }
        if (!order.getFromDoctorId().equals(elder.getDoctorId())) {
            throw new BusinessException(409, "患者责任医生已变化，本次移交申请已失效");
        }
        if (Integer.valueOf(0).equals(elder.getAccountStatus())) {
            throw new BusinessException(400, "老人账号已停用，不能继续移交");
        }
        return elder;
    }

    private void assertStatus(ReferralOrder order, Set<Integer> allowedStatuses, String actionName) {
        if (!allowedStatuses.contains(order.getStatus())) {
            throw new BusinessException(400, "当前状态【" + statusText(order.getStatus())
                    + "】不允许【" + actionName + "】操作");
        }
    }

    private void assertPermission(ReferralOrder order, Long currentUserId, Integer currentUserType,
                                  String actionName, boolean asReceiver) {
        if (currentUserId == null || currentUserType == null) {
            throw new BusinessException(401, "未登录或Token无效");
        }
        if (Integer.valueOf(1).equals(currentUserType)) {
            return;
        }
        if (!Integer.valueOf(2).equals(currentUserType)) {
            throw new BusinessException(403, "当前角色无权处理患者移交申请");
        }
        Long ownerId = asReceiver ? order.getToDoctorId() : order.getFromDoctorId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new BusinessException(403, "您不是该申请的"
                    + (asReceiver ? "接收" : "发起") + "医生，无权【" + actionName + "】");
        }
    }

    private void requireDoctor(Long currentUserId, Integer currentUserType) {
        if (currentUserId == null || !Integer.valueOf(2).equals(currentUserType)) {
            throw new BusinessException(403, "只有医生可以发起患者移交");
        }
    }

    private String statusText(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "待接收";
            case 1 -> "已接收";
            case 2 -> "处理中";
            case 3 -> "已完成";
            case 4 -> "已拒绝";
            case 5 -> "已取消";
            default -> "未知";
        };
    }

    private void notifyReferralUsers(ReferralOrder order, Long actorUserId,
                                     String title, String content, int priority) {
        if (messageService == null || order == null) {
            return;
        }
        Set<Long> recipients = new java.util.LinkedHashSet<>();
        if (order.getFromDoctorId() != null) recipients.add(order.getFromDoctorId());
        if (order.getToDoctorId() != null) recipients.add(order.getToDoctorId());
        recipients.remove(actorUserId);
        for (Long recipient : recipients) {
            try {
                messageService.sendSystemNotification(recipient, title, content, 4, priority, "/referrals");
            } catch (Exception ignored) {
                // 协作通知失败不能回滚患者移交业务。
            }
        }
    }

    private String displayName(SysUser user) {
        return StringUtils.hasText(user.getRealName()) ? user.getRealName().trim() : user.getUsername();
    }
}
