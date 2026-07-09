package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.ReferralOrder;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.ReferralOrderMapper;
import com.medical.service.ReferralService;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReferralServiceImpl implements ReferralService {

    @Autowired
    private ReferralOrderMapper referralOrderMapper;

    @Autowired
    private TimelineService timelineService;

    @Override
    public ReferralOrder createReferral(ReferralOrder order) {
        // 生成转诊编号
        String no = "REF" + System.currentTimeMillis();
        order.setReferralNo(no);
        order.setStatus(0);
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.insert(order);

        // 写入时间轴
        TimelineEvent event = new TimelineEvent();
        event.setElderId(order.getElderId());
        event.setEventType(7); // 转诊
        String typeLabel = order.getReferralType() == 1 ? "上转" : "下转";
        event.setEventTitle(typeLabel + "转诊: " + order.getFromOrg() + " → " + order.getToOrg());
        event.setEventContent("诊断: " + order.getDiagnosis() + ", 原因: " + order.getReferralReason());
        event.setSourceType("referral");
        event.setSourceId(order.getId());
        event.setDoctorId(order.getFromDoctorId());
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);

        return order;
    }

    /**
     * 校验转诊单状态是否允许当前动作（步骤 B1：状态机约束）
     * @param order 转诊单
     * @param allowedStatuses 允许的源状态码
     * @param actionName 动作名称（用于错误提示）
     */
    private void assertStatus(ReferralOrder order, java.util.Set<Integer> allowedStatuses, String actionName) {
        if (order == null) {
            throw new BusinessException(404, "转诊单不存在");
        }
        if (!allowedStatuses.contains(order.getStatus())) {
            throw new BusinessException(400, "当前状态【"
                    + statusText(order.getStatus()) + "】不允许【" + actionName + "】操作");
        }
    }

    /**
     * 校验调用者角色+所有权（步骤 B2：后端角色+所有权校验）
     * @param order 转诊单
     * @param currentUserId 当前用户ID
     * @param currentUserType 当前用户类型（1管理员/2医生/3护士）
     * @param actionName 动作名称
     * @param asReceiver true=接收方权限（接收/拒绝/完成） / false=发起方权限（取消）
     */
    private void assertPermission(ReferralOrder order, Long currentUserId, Integer currentUserType,
                                 String actionName, boolean asReceiver) {
        if (currentUserId == null || currentUserType == null) {
            throw new BusinessException(401, "未登录或Token无效");
        }
        // 护士（userType=3）任何动作都拒绝
        if (Integer.valueOf(3).equals(currentUserType)) {
            throw new BusinessException(403, "护士无权【" + actionName + "】转诊单");
        }
        // 管理员（userType=1）全放行
        if (Integer.valueOf(1).equals(currentUserType)) {
            return;
        }
        // 医生（userType=2）需要校验所有权
        Long ownerId = asReceiver ? order.getToDoctorId() : order.getFromDoctorId();
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new BusinessException(403, "您不是该转诊单的"
                    + (asReceiver ? "接收方" : "发起方") + "医生，无权【" + actionName + "】");
        }
    }

    private String statusText(Integer status) {
        if (status == null) return "未知";
        switch (status) {
            case 0: return "待接收";
            case 1: return "已接收";
            case 2: return "处理中";
            case 3: return "已完成";
            case 4: return "已拒绝";
            case 5: return "已取消";
            default: return "未知";
        }
    }

    @Override
    public void acceptReferral(Long id, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        assertPermission(order, currentUserId, currentUserType, "接收", true);
        assertStatus(order, java.util.Set.of(0), "接收");
        order.setStatus(1);
        order.setAcceptTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
    }

    @Override
    public void completeReferral(Long id, String dischargeSummary, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        assertPermission(order, currentUserId, currentUserType, "完成", true);
        assertStatus(order, java.util.Set.of(1, 2), "完成");
        order.setStatus(3);
        order.setDischargeSummary(dischargeSummary);
        order.setCompleteTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);

        // 写入时间轴 - 出院/结案
        TimelineEvent event = new TimelineEvent();
        event.setElderId(order.getElderId());
        event.setEventType(9); // 出院
        event.setEventTitle("转诊完成: " + order.getReferralNo());
        event.setEventContent("出院小结: " + dischargeSummary);
        event.setSourceType("referral");
        event.setSourceId(order.getId());
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);
    }

    @Override
    public void rejectReferral(Long id, String reason, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        assertPermission(order, currentUserId, currentUserType, "拒绝", true);
        assertStatus(order, java.util.Set.of(0, 1), "拒绝");
        order.setStatus(4);
        order.setRejectReason(reason);
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
    }

    @Override
    public void cancelReferral(Long id, String reason, Long currentUserId, Integer currentUserType) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        assertPermission(order, currentUserId, currentUserType, "取消", false);
        assertStatus(order, java.util.Set.of(0, 1), "取消");
        order.setStatus(5);
        order.setCancelReason(reason);
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
    }

    @Override
    public Page<ReferralOrder> listReferrals(Integer pageNum, Integer pageSize, Long doctorId, Integer status, Integer referralType) {
        LambdaQueryWrapper<ReferralOrder> wrapper = new LambdaQueryWrapper<>();
        if (doctorId != null) {
            wrapper.and(w -> w.eq(ReferralOrder::getFromDoctorId, doctorId).or().eq(ReferralOrder::getToDoctorId, doctorId));
        }
        if (status != null) {
            wrapper.eq(ReferralOrder::getStatus, status);
        }
        if (referralType != null) {
            wrapper.eq(ReferralOrder::getReferralType, referralType);
        }
        wrapper.orderByDesc(ReferralOrder::getCreateTime);
        return referralOrderMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public ReferralOrder getDetail(Long id) {
        return referralOrderMapper.selectById(id);
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        // 待接收
        LambdaQueryWrapper<ReferralOrder> w0 = new LambdaQueryWrapper<>();
        w0.eq(ReferralOrder::getStatus, 0);
        stats.put("pending", referralOrderMapper.selectCount(w0));
        // 处理中
        LambdaQueryWrapper<ReferralOrder> w1 = new LambdaQueryWrapper<>();
        w1.in(ReferralOrder::getStatus, 1, 2);
        stats.put("processing", referralOrderMapper.selectCount(w1));
        // 上转数
        LambdaQueryWrapper<ReferralOrder> wUp = new LambdaQueryWrapper<>();
        wUp.eq(ReferralOrder::getReferralType, 1);
        stats.put("upCount", referralOrderMapper.selectCount(wUp));
        // 下转数
        LambdaQueryWrapper<ReferralOrder> wDown = new LambdaQueryWrapper<>();
        wDown.eq(ReferralOrder::getReferralType, 2);
        stats.put("downCount", referralOrderMapper.selectCount(wDown));
        // 已完成
        LambdaQueryWrapper<ReferralOrder> wDone = new LambdaQueryWrapper<>();
        wDone.eq(ReferralOrder::getStatus, 3);
        stats.put("completed", referralOrderMapper.selectCount(wDone));
        return stats;
    }
}
