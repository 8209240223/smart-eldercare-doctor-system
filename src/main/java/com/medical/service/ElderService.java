package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;

import java.util.Map;

/**
 * 老人档案服务接口
 */
public interface ElderService {

    Page<ElderInfo> listElders(Integer pageNum, Integer pageSize, String name, String community, Long doctorId);

    ElderInfo getDetail(Long id);

    Long create(ElderInfo elderInfo);

    void update(Long id, ElderInfo elderInfo);

    void delete(Long id);

    HealthRecord getHealthRecord(Long elderId);

    void saveHealthRecord(Long elderId, HealthRecord record);

    Map<String, Object> getStats();
}
