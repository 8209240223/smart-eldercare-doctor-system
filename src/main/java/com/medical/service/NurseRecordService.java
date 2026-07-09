package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.NursingRecord;

import java.util.Map;

/**
 * 护理记录服务接口
 */
public interface NurseRecordService {

    Page<NursingRecord> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                             Integer recordType, Integer reportStatus, String startDate, String endDate);

    NursingRecord getById(Long id);

    Long create(NursingRecord record);

    void update(Long id, NursingRecord record);

    void delete(Long id);

    /**
     * 上报异常护理记录给医生
     */
    void reportAbnormal(Long id, String abnormalDesc);

    Map<String, Object> getStats(Long nurseId);
}
