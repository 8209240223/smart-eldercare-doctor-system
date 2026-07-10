package com.medical.dto;

import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.entity.MedicalHistory;
import com.medical.entity.PhysicalExam;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ElderOnboardResult {
    private ElderInfo elder;
    private HealthRecord healthRecord;
    private PhysicalExam initialExam;
    private List<MedicalHistory> medicalHistories = new ArrayList<>();
    private CareWorkflowResult workflow;
}
