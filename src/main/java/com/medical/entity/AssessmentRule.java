package com.medical.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 评估规则配置实体
 */
@Data
@TableName("assessment_rule")
public class AssessmentRule implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 规则编码 */
    private String ruleCode;

    /** 规则名称 */
    private String ruleName;

    /** 分类: 血压/血糖/心率/血氧/体温/BMI/腰围/病史/过敏/家族史/用药/生活方式/生活能力/预警/随访/干预/评估/护理/转诊/设备 */
    private String category;

    /** 指标字段名 */
    private String indicator;

    /** 数据来源: physical_exam/vital_sign/health_record/aggregate */
    private String dataSource;

    /** 比较符 */
    private String operator;

    /** 阈值 */
    private BigDecimal threshold;

    /** 附加条件(如 gender=1) */
    private String extraCondition;

    /** 严重程度: 1提示 2注意 3警告 */
    private Integer severity;

    /** 发现描述模板 */
    private String findingText;

    /** 建议措施 */
    private String adviceText;

    /** 是否启用 */
    private Integer enabled;

    /** 同类内排序 */
    private Integer sortOrder;

    private LocalDateTime createTime;
}
