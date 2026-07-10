package com.medical.service;

import com.medical.common.exception.BusinessException;
import com.medical.dto.CareWorkflowResult;
import com.medical.dto.ElderOnboardRequest;
import com.medical.dto.ElderOnboardResult;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.entity.MedicalHistory;
import com.medical.entity.PhysicalExam;
import com.medical.entity.SysUser;
import com.medical.mapper.MedicalHistoryMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class ElderOnboardingService {

    @Autowired private ElderService elderService;
    @Autowired private ExamService examService;
    @Autowired private CareWorkflowService careWorkflowService;
    @Autowired private MedicalHistoryMapper medicalHistoryMapper;
    @Autowired private SysUserMapper sysUserMapper;

    @Transactional
    public ElderOnboardResult onboard(ElderOnboardRequest request, Long currentUserId, Integer currentUserType) {
        assertPermission(currentUserId, currentUserType);
        if (request == null || request.getElder() == null) {
            throw new BusinessException(400, "老人主档不能为空");
        }

        ElderInfo elder = request.getElder();
        elder.setId(null);
        if (Integer.valueOf(2).equals(currentUserType) && elder.getDoctorId() == null) {
            elder.setDoctorId(currentUserId);
        }
        if (elder.getDoctorId() != null) {
            requireActiveDoctor(elder.getDoctorId());
        }
        Long elderId = elderService.create(elder);

        HealthRecord persistedHealthRecord = null;
        if (request.getHealthRecord() != null) {
            HealthRecord healthRecord = request.getHealthRecord();
            healthRecord.setId(null);
            healthRecord.setElderId(elderId);
            if (healthRecord.getCreateDoctorId() == null) {
                healthRecord.setCreateDoctorId(currentUserId);
            }
            elderService.saveHealthRecord(elderId, healthRecord);
            persistedHealthRecord = elderService.getHealthRecord(elderId);
        }

        List<MedicalHistory> persistedHistories = new ArrayList<>();
        if (request.getMedicalHistories() != null) {
            for (MedicalHistory history : request.getMedicalHistories()) {
                if (history == null || !StringUtils.hasText(history.getDiseaseName())) {
                    throw new BusinessException(400, "病史中的疾病名称不能为空");
                }
                history.setId(null);
                history.setElderId(elderId);
                medicalHistoryMapper.insert(history);
                persistedHistories.add(history);
            }
        }

        PhysicalExam initialExam = request.getInitialExam();
        if (initialExam != null) {
            initialExam.setId(null);
            initialExam.setElderId(elderId);
            if (initialExam.getDoctorId() == null) {
                initialExam.setDoctorId(Integer.valueOf(2).equals(currentUserType)
                        ? currentUserId : elder.getDoctorId());
            }
            examService.create(initialExam);
        }

        CareWorkflowResult workflow = null;
        if (!Boolean.FALSE.equals(request.getGenerateWorkflow())) {
            workflow = careWorkflowService.generate(elderId, currentUserId, currentUserType);
        }

        ElderOnboardResult result = new ElderOnboardResult();
        result.setElder(elderService.getDetail(elderId));
        result.setHealthRecord(persistedHealthRecord);
        result.setMedicalHistories(persistedHistories);
        result.setInitialExam(initialExam);
        result.setWorkflow(workflow);
        return result;
    }

    private void assertPermission(Long currentUserId, Integer currentUserType) {
        if (currentUserId == null || currentUserType == null) {
            throw new BusinessException(401, "未获取到当前登录用户");
        }
        if (!Integer.valueOf(2).equals(currentUserType)) {
            throw new BusinessException(403, "只有医生可以统一建档");
        }
    }

    private void requireActiveDoctor(Long doctorId) {
        SysUser doctor = sysUserMapper.selectById(doctorId);
        if (doctor == null
                || !Integer.valueOf(2).equals(doctor.getUserType())
                || !Integer.valueOf(1).equals(doctor.getStatus())
                || Integer.valueOf(1).equals(doctor.getDeleted())) {
            throw new BusinessException(400, "责任医生必须选择启用中的真实医生账号");
        }
    }
}
