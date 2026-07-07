package com.medical.service.risk;

import java.time.LocalDateTime;

/**
 * 风险评分上下文
 * 包含计算风险评分所需的各种数据
 */
public class RiskContext {

    /**
     * 老人年龄
     */
    private Integer age;

    /**
     * 慢病数量
     */
    private Integer chronicDiseaseCount;

    /**
     * 近30天预警次数
     */
    private Integer warningCountIn30Days;

    /**
     * 高危预警次数
     */
    private Integer highLevelWarningCount;

    /**
     * 随访逾期天数
     */
    private Integer followupOverdueDays;

    /**
     * 近30天护理异常上报次数
     */
    private Integer nursingAbnormalCount;

    /**
     * 最近随访时间
     */
    private LocalDateTime lastFollowupTime;

    /**
     * 近30天体征异常次数
     */
    private Integer vitalSignAbnormalCount;

    public RiskContext() {}

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public Integer getChronicDiseaseCount() {
        return chronicDiseaseCount;
    }

    public void setChronicDiseaseCount(Integer chronicDiseaseCount) {
        this.chronicDiseaseCount = chronicDiseaseCount;
    }

    public Integer getWarningCountIn30Days() {
        return warningCountIn30Days;
    }

    public void setWarningCountIn30Days(Integer warningCountIn30Days) {
        this.warningCountIn30Days = warningCountIn30Days;
    }

    public Integer getHighLevelWarningCount() {
        return highLevelWarningCount;
    }

    public void setHighLevelWarningCount(Integer highLevelWarningCount) {
        this.highLevelWarningCount = highLevelWarningCount;
    }

    public Integer getFollowupOverdueDays() {
        return followupOverdueDays;
    }

    public void setFollowupOverdueDays(Integer followupOverdueDays) {
        this.followupOverdueDays = followupOverdueDays;
    }

    public Integer getNursingAbnormalCount() {
        return nursingAbnormalCount;
    }

    public void setNursingAbnormalCount(Integer nursingAbnormalCount) {
        this.nursingAbnormalCount = nursingAbnormalCount;
    }

    public LocalDateTime getLastFollowupTime() {
        return lastFollowupTime;
    }

    public void setLastFollowupTime(LocalDateTime lastFollowupTime) {
        this.lastFollowupTime = lastFollowupTime;
    }

    public Integer getVitalSignAbnormalCount() {
        return vitalSignAbnormalCount;
    }

    public void setVitalSignAbnormalCount(Integer vitalSignAbnormalCount) {
        this.vitalSignAbnormalCount = vitalSignAbnormalCount;
    }
}