package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.ElderRiskProfile;

import java.util.List;
import java.util.Map;

/**
 * 风险分层服务接口
 */
public interface RiskProfileService {

    /**
     * 手动触发全量风险计算
     * @return 计算的老人数量
     */
    int calculateAllRisk();

    /**
     * 计算单个老人的风险评分
     * @param elderId 老人ID
     * @return 风险评分结果
     */
    ElderRiskProfile calculateRisk(Long elderId);

    /**
     * 获取重点人群列表
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @param riskLevel 风险等级筛选(null表示全部)
     * @param doctorId 医生ID筛选(null表示全部)
     * @param community 社区筛选(null表示全部)
     * @return 分页结果
     */
    Page<Map<String, Object>> getKeyPopulationList(Integer pageNum, Integer pageSize, 
            Integer riskLevel, Long doctorId, String community);

    /**
     * 获取老人风险画像详情
     * @param elderId 老人ID
     * @return 风险详情(包含评分项、风险标签、原因)
     */
    Map<String, Object> getRiskProfileDetail(Long elderId);

    /**
     * 统计各风险等级人数
     * @return 统计结果
     */
    Map<String, Object> getRiskLevelStats();

    /**
     * 获取高危老人数量
     */
    int countHighRisk();

    /**
     * 获取重点老人数量
     */
    int countKeyPopulation();
}