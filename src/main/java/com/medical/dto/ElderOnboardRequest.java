package com.medical.dto;

import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.entity.MedicalHistory;
import com.medical.entity.PhysicalExam;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Data
public class ElderOnboardRequest {

    @Valid
    @NotNull(message = "老人主档不能为空")
    private ElderInfo elder;

    private HealthRecord healthRecord;
    private PhysicalExam initialExam;
    private List<MedicalHistory> medicalHistories = new ArrayList<>();
    private Boolean generateWorkflow = Boolean.TRUE;
}
