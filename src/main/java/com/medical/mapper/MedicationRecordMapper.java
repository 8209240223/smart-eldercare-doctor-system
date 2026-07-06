package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.MedicationRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MedicationRecordMapper extends BaseMapper<MedicationRecord> {
}
