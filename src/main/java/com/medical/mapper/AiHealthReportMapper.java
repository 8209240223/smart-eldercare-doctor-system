package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.AiHealthReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * AI 健康评估报告 Mapper
 */
@Mapper
public interface AiHealthReportMapper extends BaseMapper<AiHealthReport> {

    @Select("SELECT * FROM ai_health_report WHERE elder_id = #{elderId} AND source = 1 AND status = 0 " +
            "ORDER BY create_time DESC LIMIT 1 FOR UPDATE")
    AiHealthReport selectRuleDraftForUpdate(@Param("elderId") Long elderId);
}
