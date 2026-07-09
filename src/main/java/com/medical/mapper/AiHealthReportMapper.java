package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.AiHealthReport;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI 健康评估报告 Mapper
 */
@Mapper
public interface AiHealthReportMapper extends BaseMapper<AiHealthReport> {
}
