package com.medical.dto;

import com.medical.entity.AiHealthReport;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowupTask;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class CareWorkflowResult {

    private ElderInfo elder;
    private Step<ElderRiskProfile> risk;
    private Step<FollowPlan> plan;
    private Step<FollowupTask> task;
    private Step<AiHealthReport> report;
    private boolean healthRecordPresent;
    private long examCount;
    private long nursingPlanCount;
    private long nursingRecordCount;
    private Map<String, String> links = new LinkedHashMap<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Step<T> {
        private String status;
        private boolean created;
        private boolean reused;
        private T data;
    }
}
