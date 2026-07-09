package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.medical.entity.FollowupTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 随访任务Mapper
 */
@Mapper
public interface FollowupTaskMapper extends BaseMapper<FollowupTask> {

    /**
     * 查询今日待执行任务
     */
    @Select("SELECT ft.*, ei.name, ei.phone, ei.community " +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ft.status = 0 AND ft.due_date <= #{today} AND ei.deleted = 0 " +
            "ORDER BY ft.priority DESC, ft.due_date ASC")
    List<Map<String, Object>> selectTodayTasks(@Param("today") LocalDate today);

    /**
     * 根据医生ID查询任务列表(返回List)
     */
    @Select("SELECT ft.*, ei.name, ei.phone, ei.community " +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ft.doctor_id = #{doctorId} AND ft.status = #{status} AND ei.deleted = 0 " +
            "ORDER BY ft.priority DESC, ft.due_date ASC")
    List<Map<String, Object>> selectByDoctorId(@Param("doctorId") Long doctorId, @Param("status") Integer status);

    @Select("SELECT ft.*, ei.name, ei.phone, ei.community " +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ft.status = #{status} AND ei.deleted = 0 " +
            "ORDER BY ft.priority DESC, ft.due_date ASC")
    List<Map<String, Object>> selectByStatus(@Param("status") Integer status);

    /**
     * 统计待执行任务数量
     */
    @Select("SELECT COUNT(*) FROM followup_task WHERE status = 0")
    int countPendingTasks();

    /**
     * 统计今日任务数量
     */
    @Select("SELECT COUNT(*) FROM followup_task WHERE status = 0 AND due_date <= #{today}")
    int countTodayTasks(@Param("today") LocalDate today);

    /**
     * 检查是否存在相同任务
     */
    @Select("SELECT COUNT(*) FROM followup_task WHERE elder_id = #{elderId} AND task_type = #{taskType} AND status = 0")
    int checkDuplicateTask(@Param("elderId") Long elderId, @Param("taskType") Integer taskType);
}
