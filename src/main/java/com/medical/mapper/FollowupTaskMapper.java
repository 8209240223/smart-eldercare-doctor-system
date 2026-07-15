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

    String TASK_WITH_ELDER_COLUMNS = "SELECT ft.id, ft.elder_id AS elderId, ft.plan_id AS planId, " +
            "ft.doctor_id AS doctorId, ft.task_type AS taskType, ft.priority, ft.due_date AS dueDate, " +
            "ft.status, ft.source, ft.task_reason AS taskReason, ft.create_time AS createTime, " +
            "ft.finish_time AS finishTime, ft.follow_record_id AS followRecordId, ft.remark, " +
            "ei.name, ei.name AS elderName, ei.phone, ei.phone AS elderPhone, ei.community ";

    String ROLE_SCOPE_SQL = "<choose>" +
            "<when test='currentUserType == 2'>" +
            "AND ft.doctor_id = #{currentUserId} AND ei.doctor_id = #{currentUserId} " +
            "</when>" +
            "<when test='currentUserType == 3'>" +
            "AND (ei.nurse_id = #{currentUserId} OR EXISTS (" +
            "SELECT 1 FROM doctor_nurse_relation dnr " +
            "WHERE dnr.doctor_id = ei.doctor_id AND dnr.nurse_id = #{currentUserId} AND dnr.status = 1" +
            ")) " +
            "</when>" +
            "<when test='currentUserType == 1'></when>" +
            "<otherwise>AND 1 = 0 </otherwise>" +
            "</choose>";

    /**
     * 查询今日待执行任务
     */
    @Select("<script>" + TASK_WITH_ELDER_COLUMNS +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ft.status = 0 AND ft.due_date &lt;= #{today} AND ei.deleted = 0 " +
            ROLE_SCOPE_SQL +
            "ORDER BY ft.priority DESC, ft.due_date ASC" +
            "</script>")
    List<Map<String, Object>> selectTodayTasks(@Param("today") LocalDate today,
                                                @Param("currentUserId") Long currentUserId,
                                                @Param("currentUserType") Integer currentUserType);

    /**
     * 根据医生ID查询任务列表(返回List)
     */
    @Select(TASK_WITH_ELDER_COLUMNS +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ft.doctor_id = #{doctorId} AND ft.status = #{status} AND ei.deleted = 0 " +
            "ORDER BY ft.priority DESC, ft.due_date ASC")
    List<Map<String, Object>> selectByDoctorId(@Param("doctorId") Long doctorId, @Param("status") Integer status);

    @Select(TASK_WITH_ELDER_COLUMNS +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ft.status = #{status} AND ei.deleted = 0 " +
            "ORDER BY ft.priority DESC, ft.due_date ASC")
    List<Map<String, Object>> selectByStatus(@Param("status") Integer status);

    @Select("<script>" +
            TASK_WITH_ELDER_COLUMNS +
            "FROM followup_task ft " +
            "LEFT JOIN elder_info ei ON ft.elder_id = ei.id " +
            "WHERE ei.deleted = 0 " +
            ROLE_SCOPE_SQL +
            "<if test='doctorId != null'>AND ft.doctor_id = #{doctorId} </if>" +
            "<if test='elderId != null'>AND ft.elder_id = #{elderId} </if>" +
            "<if test='status != null'>AND ft.status = #{status} </if>" +
            "ORDER BY ft.priority DESC, ft.due_date ASC" +
            "</script>")
    List<Map<String, Object>> selectTasks(@Param("doctorId") Long doctorId,
                                          @Param("elderId") Long elderId,
                                          @Param("status") Integer status,
                                          @Param("currentUserId") Long currentUserId,
                                          @Param("currentUserType") Integer currentUserType);

    /**
     * 统计待执行任务数量
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM followup_task ft " +
            "JOIN elder_info ei ON ei.id = ft.elder_id " +
            "WHERE ft.status = 0 AND ei.deleted = 0 " +
            ROLE_SCOPE_SQL +
            "</script>")
    int countPendingTasks(@Param("currentUserId") Long currentUserId,
                          @Param("currentUserType") Integer currentUserType);

    /**
     * 统计今日任务数量
     */
    @Select("<script>" +
            "SELECT COUNT(*) FROM followup_task ft " +
            "JOIN elder_info ei ON ei.id = ft.elder_id " +
            "WHERE ft.status = 0 AND ft.due_date &lt;= #{today} AND ei.deleted = 0 " +
            ROLE_SCOPE_SQL +
            "</script>")
    int countTodayTasks(@Param("today") LocalDate today,
                        @Param("currentUserId") Long currentUserId,
                        @Param("currentUserType") Integer currentUserType);

    @Select("<script>" + TASK_WITH_ELDER_COLUMNS +
            "FROM followup_task ft " +
            "JOIN elder_info ei ON ei.id = ft.elder_id " +
            "WHERE ft.status = 0 AND ft.due_date &lt; #{today} AND ei.deleted = 0 " +
            ROLE_SCOPE_SQL +
            "ORDER BY ft.priority DESC, ft.due_date ASC" +
            "</script>")
    List<Map<String, Object>> selectOverdueTasks(@Param("today") LocalDate today,
                                                  @Param("currentUserId") Long currentUserId,
                                                  @Param("currentUserType") Integer currentUserType);

    /**
     * 检查是否存在相同任务
     */
    @Select("SELECT COUNT(*) FROM followup_task WHERE elder_id = #{elderId} AND task_type = #{taskType} AND status = 0")
    int checkDuplicateTask(@Param("elderId") Long elderId, @Param("taskType") Integer taskType);

    @Select("SELECT * FROM followup_task WHERE elder_id = #{elderId} AND plan_id = #{planId} AND status = 0 " +
            "ORDER BY create_time DESC LIMIT 1")
    FollowupTask selectPendingByPlanId(@Param("elderId") Long elderId, @Param("planId") Long planId);

    @Select("SELECT * FROM followup_task WHERE elder_id = #{elderId} ORDER BY create_time DESC LIMIT 1")
    FollowupTask selectLatestByElder(@Param("elderId") Long elderId);
}
