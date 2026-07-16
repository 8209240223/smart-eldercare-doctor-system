package com.medical.scheduler;

import com.medical.service.FollowupTaskService;
import com.medical.service.RiskProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 风险分层定时任务
 * 每天凌晨自动计算老人风险分层并生成随访任务
 */
@Component
public class RiskProfileScheduler {

    private static final Logger logger = LoggerFactory.getLogger(RiskProfileScheduler.class);

    @Autowired
    private RiskProfileService riskProfileService;

    @Autowired
    private FollowupTaskService followupTaskService;

    /**
     * 每天凌晨2点执行风险分层计算
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledRiskCalculation() {
        logger.info("开始执行定时风险分层计算...");
        try {
            int count = riskProfileService.calculateAllRisk();
            logger.info("定时风险分层计算完成，共计算{}位老人", count);
        } catch (Exception e) {
            logger.error("定时风险分层计算失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 每天凌晨3点执行随访任务自动生成
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void scheduledFollowupTaskGeneration() {
        logger.info("开始执行随访任务自动生成...");
        try {
            int taskCount = followupTaskService.generateAutoTasks(null, null, null);
            logger.info("随访任务自动生成完成，共生成{}条任务", taskCount);
        } catch (Exception e) {
            logger.error("随访任务自动生成失败: {}", e.getMessage(), e);
        }
    }
}
