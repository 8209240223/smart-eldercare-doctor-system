package com.medical.assistant.agent;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.FollowupTask;
import com.medical.entity.HealthWarning;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;
import com.medical.entity.ReferralOrder;
import com.medical.entity.SysUser;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.FollowupTaskMapper;
import com.medical.mapper.HealthWarningMapper;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import com.medical.mapper.ReferralOrderMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AssistantPermissionService {

    public static final int ADMIN = 1;
    public static final int DOCTOR = 2;
    public static final int NURSE = 3;

    private final ElderInfoMapper elderInfoMapper;
    private final FollowupTaskMapper followupTaskMapper;
    private final HealthWarningMapper healthWarningMapper;
    private final NursingRecordMapper nursingRecordMapper;
    private final NursingPlanMapper nursingPlanMapper;
    private final ReferralOrderMapper referralOrderMapper;
    private final SysUserMapper sysUserMapper;

    public AssistantPermissionService(ElderInfoMapper elderInfoMapper,
                                      FollowupTaskMapper followupTaskMapper,
                                      HealthWarningMapper healthWarningMapper,
                                      NursingRecordMapper nursingRecordMapper,
                                      NursingPlanMapper nursingPlanMapper,
                                      ReferralOrderMapper referralOrderMapper,
                                      SysUserMapper sysUserMapper) {
        this.elderInfoMapper = elderInfoMapper;
        this.followupTaskMapper = followupTaskMapper;
        this.healthWarningMapper = healthWarningMapper;
        this.nursingRecordMapper = nursingRecordMapper;
        this.nursingPlanMapper = nursingPlanMapper;
        this.referralOrderMapper = referralOrderMapper;
        this.sysUserMapper = sysUserMapper;
    }

    public void requireAuthenticated(AssistantExecutionContext context) {
        if (context == null || context.userId() == null || context.role() == null) {
            throw new BusinessException(401, "未获取到当前登录用户");
        }
        if (context.role() < ADMIN || context.role() > NURSE) {
            throw new BusinessException(403, "当前角色无权使用站内 Agent");
        }
        SysUser user = sysUserMapper.selectById(context.userId());
        if (user == null || Integer.valueOf(1).equals(user.getDeleted())
                || !Integer.valueOf(1).equals(user.getStatus())
                || !context.role().equals(user.getUserType())) {
            throw new BusinessException(403, "当前账号已停用或角色信息无效");
        }
    }

    public void requireRole(AssistantExecutionContext context, Set<Integer> allowedRoles) {
        requireAuthenticated(context);
        if (!allowedRoles.contains(context.role())) {
            throw new BusinessException(403, "当前角色无权调用该站内工具");
        }
    }

    public ElderInfo requireElderAccess(AssistantExecutionContext context, Long elderId) {
        requireAuthenticated(context);
        if (elderId == null || elderId <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        ElderInfo elder = elderInfoMapper.selectById(elderId);
        if (elder == null || Integer.valueOf(1).equals(elder.getDeleted())) {
            throw new BusinessException(404, "老人不存在或已删除");
        }
        if (context.role() == DOCTOR && !context.userId().equals(elder.getDoctorId())) {
            throw new BusinessException(403, "该老人不属于当前责任医生");
        }
        return elder;
    }

    public FollowupTask requireOwnedTask(AssistantExecutionContext context, Long taskId) {
        requireRole(context, Set.of(DOCTOR));
        FollowupTask task = followupTaskMapper.selectById(taskId);
        if (task == null) {
            throw new BusinessException(404, "随访任务不存在");
        }
        if (!context.userId().equals(task.getDoctorId())) {
            throw new BusinessException(403, "无权操作其他医生的随访任务");
        }
        requireElderAccess(context, task.getElderId());
        return task;
    }

    public HealthWarning requireOwnedWarning(AssistantExecutionContext context, Long warningId) {
        requireRole(context, Set.of(DOCTOR));
        HealthWarning warning = healthWarningMapper.selectById(warningId);
        if (warning == null) {
            throw new BusinessException(404, "预警不存在");
        }
        requireElderAccess(context, warning.getElderId());
        if (warning.getDoctorId() != null && !context.userId().equals(warning.getDoctorId())) {
            throw new BusinessException(403, "无权操作其他医生的预警");
        }
        return warning;
    }

    public NursingRecord requireOwnedNursingRecord(AssistantExecutionContext context, Long recordId) {
        requireRole(context, Set.of(NURSE));
        NursingRecord record = nursingRecordMapper.selectById(recordId);
        if (record == null || Integer.valueOf(1).equals(record.getDeleted())) {
            throw new BusinessException(404, "护理记录不存在");
        }
        if (!context.userId().equals(record.getNurseId())) {
            throw new BusinessException(403, "无权操作其他护士的护理记录");
        }
        return record;
    }

    public NursingPlan requireOwnedNursingPlan(AssistantExecutionContext context, Long planId) {
        requireRole(context, Set.of(NURSE));
        NursingPlan plan = nursingPlanMapper.selectById(planId);
        if (plan == null || Integer.valueOf(1).equals(plan.getDeleted())) {
            throw new BusinessException(404, "护理计划不存在");
        }
        if (!context.userId().equals(plan.getNurseId())) {
            throw new BusinessException(403, "无权操作其他护士的护理计划");
        }
        return plan;
    }

    public ReferralOrder requireReferralAccess(AssistantExecutionContext context, Long referralId) {
        requireRole(context, Set.of(DOCTOR));
        ReferralOrder referral = referralOrderMapper.selectById(referralId);
        if (referral == null) {
            throw new BusinessException(404, "转诊单不存在");
        }
        requireElderAccess(context, referral.getElderId());
        return referral;
    }
}
