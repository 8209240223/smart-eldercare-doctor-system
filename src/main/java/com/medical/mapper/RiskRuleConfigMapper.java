package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.RiskRuleConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 风险评分规则配置Mapper
 */
@Mapper
public interface RiskRuleConfigMapper extends BaseMapper<RiskRuleConfig> {

    /**
     * 查询所有启用的规则
     */
    @Select("SELECT * FROM risk_rule_config WHERE enabled = 1 ORDER BY score DESC")
    List<RiskRuleConfig> selectAllEnabled();
}