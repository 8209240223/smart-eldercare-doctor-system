package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.FollowPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface FollowPlanMapper extends BaseMapper<FollowPlan> {

    @Select("SELECT * FROM follow_plan WHERE elder_id = #{elderId} AND status IN (0, 1) AND deleted = 0 " +
            "ORDER BY create_time DESC LIMIT 1")
    FollowPlan selectLatestActiveByElder(@Param("elderId") Long elderId);

    @Select("SELECT * FROM follow_plan WHERE elder_id = #{elderId} AND status IN (0, 1) AND deleted = 0 " +
            "ORDER BY create_time DESC LIMIT 1 FOR UPDATE")
    FollowPlan selectLatestActiveByElderForUpdate(@Param("elderId") Long elderId);

    @Select("SELECT * FROM follow_plan WHERE elder_id = #{elderId} AND deleted = 0 " +
            "ORDER BY create_time DESC LIMIT 1")
    FollowPlan selectLatestByElder(@Param("elderId") Long elderId);

    @Select("SELECT * FROM follow_plan WHERE id = #{id} AND deleted = 0 FOR UPDATE")
    FollowPlan selectByIdForUpdate(@Param("id") Long id);
}
