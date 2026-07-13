package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.WearableDevice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface WearableDeviceMapper extends BaseMapper<WearableDevice> {

    @Select("""
            SELECT id, elder_id, device_type, device_name, device_sn,
                   bind_status, bind_time, create_time
            FROM wearable_device
            WHERE device_sn = #{deviceSn}
            ORDER BY bind_time DESC, create_time DESC, id DESC
            FOR UPDATE
            """)
    List<WearableDevice> selectByDeviceSnForUpdate(@Param("deviceSn") String deviceSn);
}
