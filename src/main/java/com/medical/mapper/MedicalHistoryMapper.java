package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.MedicalHistory;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MedicalHistoryMapper extends BaseMapper<MedicalHistory> {
}
