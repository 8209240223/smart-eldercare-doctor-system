package com.medical.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * AI 健康评估报告实体
 */
@Data
@TableName("ai_health_report")
public class AiHealthReport implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 老人ID */
    private Long elderId;

    /** 生成/确认医生ID */
    private Long doctorId;

    /** 来源: 1规则引擎 2AI引擎 */
    private Integer source;

    /** 风险评分(0-100) */
    private Integer riskScore;

    /** 风险等级: LOW/MEDIUM/HIGH/CRITICAL */
    private String riskLevel;

    /** 结构化报告JSON */
    private String reportJson;

    /** 状态: 0草稿 1已确认 2已驳回 3已归档 */
    private Integer status;

    /** 使用的模型名称 */
    private String modelName;

    /** 提示词模板版本号 */
    private String promptVersion;

    /** 驳回原因 */
    private String rejectReason;

    /** 医生编辑后的报告JSON */
    private String editedReportJson;

    /** 生成时间 */
    private LocalDateTime createTime;

    /** 确认时间 */
    private LocalDateTime confirmTime;
}
