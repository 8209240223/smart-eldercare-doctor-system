package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.NursingRecord;

import java.util.Map;

/**
 * 护理记录服务接口
 */
public interface NurseRecordService {

    Page<NursingRecord> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                             Integer recordType, Integer reportStatus, String startDate, String endDate,
                             Long currentUserId, Integer currentUserType);

    NursingRecord getById(Long id, Long currentUserId, Integer currentUserType);

    Long create(NursingRecord record);

    void update(Long id, NursingRecord record, Long currentNurseId);

    void delete(Long id, Long currentNurseId);

    /**
     * 上报异常护理记录给医生
     */
    void reportAbnormal(Long id, String abnormalDesc, Long currentNurseId);

    Map<String, Object> getStats(Long currentUserId, Integer currentUserType);
}
