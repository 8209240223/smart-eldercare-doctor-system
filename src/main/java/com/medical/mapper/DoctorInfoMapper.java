package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.DoctorInfo;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DoctorInfoMapper extends BaseMapper<DoctorInfo> {
}
