package com.medical.service;

import com.medical.dto.CareWorkflowResult;
import com.medical.dto.ElderOnboardRequest;
import com.medical.dto.ElderOnboardResult;
import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.entity.MedicalHistory;
import com.medical.entity.PhysicalExam;
import com.medical.entity.SysUser;
import com.medical.mapper.MedicalHistoryMapper;
import com.medical.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ElderOnboardingServiceTest {

    @Test
    void disablingWorkflowCannotAssignElderToAnotherDoctor() {
        ElderOnboardingService service = new ElderOnboardingService();
        ElderInfo elder = new ElderInfo();
        elder.setDoctorId(8L);
        ElderOnboardRequest request = new ElderOnboardRequest();
        request.setElder(elder);
        request.setGenerateWorkflow(false);

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.onboard(request, 7L, 2));

        assertEquals(403, error.getCode());
        assertEquals("老人责任医生必须是当前登录医生", error.getMessage());
    }

    @Test
    void healthRecordAndInitialExamCannotForgeDoctorOwnership() {
        ElderOnboardingService service = new ElderOnboardingService();
        ElderOnboardRequest healthRequest = new ElderOnboardRequest();
        healthRequest.setElder(new ElderInfo());
        HealthRecord healthRecord = new HealthRecord();
        healthRecord.setCreateDoctorId(8L);
        healthRequest.setHealthRecord(healthRecord);

        BusinessException healthError = assertThrows(BusinessException.class,
                () -> service.onboard(healthRequest, 7L, 2));

        assertEquals(403, healthError.getCode());
        assertEquals("健康档案建档医生必须是当前登录医生", healthError.getMessage());

        ElderOnboardRequest examRequest = new ElderOnboardRequest();
        examRequest.setElder(new ElderInfo());
        PhysicalExam exam = new PhysicalExam();
        exam.setDoctorId(8L);
        examRequest.setInitialExam(exam);

        BusinessException examError = assertThrows(BusinessException.class,
                () -> service.onboard(examRequest, 7L, 2));

        assertEquals(403, examError.getCode());
        assertEquals("初始体检医生必须是当前登录医生", examError.getMessage());
    }

    @Test
    void onboardBindsAllSubmittedRecordsToNewElderAndRunsWorkflow() throws Exception {
        ElderService elderService = mock(ElderService.class);
        ExamService examService = mock(ExamService.class);
        CareWorkflowService workflowService = mock(CareWorkflowService.class);
        MedicalHistoryMapper historyMapper = mock(MedicalHistoryMapper.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        ElderOnboardingService service = new ElderOnboardingService();
        ReflectionTestUtils.setField(service, "elderService", elderService);
        ReflectionTestUtils.setField(service, "examService", examService);
        ReflectionTestUtils.setField(service, "careWorkflowService", workflowService);
        ReflectionTestUtils.setField(service, "medicalHistoryMapper", historyMapper);
        ReflectionTestUtils.setField(service, "sysUserMapper", userMapper);

        ElderInfo elder = new ElderInfo();
        elder.setName("新建老人");
        HealthRecord healthRecord = new HealthRecord();
        PhysicalExam exam = new PhysicalExam();
        MedicalHistory history = new MedicalHistory();
        history.setDiseaseName("高血压");
        ElderOnboardRequest request = new ElderOnboardRequest();
        request.setElder(elder);
        request.setHealthRecord(healthRecord);
        request.setInitialExam(exam);
        request.setMedicalHistories(List.of(history));

        SysUser doctor = new SysUser();
        doctor.setId(7L);
        doctor.setUserType(2);
        doctor.setStatus(1);
        doctor.setDeleted(0);
        when(userMapper.selectById(7L)).thenReturn(doctor);
        when(elderService.create(elder)).thenAnswer(invocation -> {
            elder.setId(90L);
            return 90L;
        });
        when(elderService.getDetail(90L)).thenReturn(elder);
        when(elderService.getHealthRecord(90L)).thenReturn(healthRecord);
        when(examService.create(exam)).thenReturn(301L);
        doAnswer(invocation -> {
            history.setId(201L);
            return 1;
        }).when(historyMapper).insert(history);
        CareWorkflowResult workflow = new CareWorkflowResult();
        when(workflowService.generate(90L, 7L, 2)).thenReturn(workflow);

        ElderOnboardResult result = service.onboard(request, 7L, 2);

        assertEquals(7L, elder.getDoctorId());
        assertEquals(90L, healthRecord.getElderId());
        assertEquals(7L, healthRecord.getCreateDoctorId());
        assertEquals(90L, exam.getElderId());
        assertEquals(7L, exam.getDoctorId());
        assertEquals(90L, history.getElderId());
        assertEquals(201L, history.getId());
        assertEquals(workflow, result.getWorkflow());
        verify(elderService).saveHealthRecord(90L, healthRecord);
        verify(examService).create(exam);
        verify(workflowService).generate(90L, 7L, 2);

        Method method = ElderOnboardingService.class.getMethod(
                "onboard", ElderOnboardRequest.class, Long.class, Integer.class);
        assertNotNull(method.getAnnotation(Transactional.class));
    }
}
