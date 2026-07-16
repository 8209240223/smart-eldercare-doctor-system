package com.medical.mapper;

import com.baomidou.mybatisplus.annotation.InterceptorIgnore;
import com.medical.entity.ElderInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
@InterceptorIgnore(dataPermission = "true")
public interface PatientHandoffMapper {

    @Select("SELECT * FROM elder_info WHERE id = #{elderId} AND deleted = 0 FOR UPDATE")
    ElderInfo selectElderForUpdate(@Param("elderId") Long elderId);

    @Select("SELECT name FROM elder_info WHERE id = #{elderId} LIMIT 1")
    String selectElderName(@Param("elderId") Long elderId);

    @Update("UPDATE health_warning SET doctor_id = #{toDoctorId}, update_time = NOW() "
            + "WHERE elder_id = #{elderId} AND deleted = 0 AND status IN (0, 1)")
    int transferOpenWarnings(@Param("elderId") Long elderId, @Param("toDoctorId") Long toDoctorId);

    @Update("UPDATE follow_plan SET doctor_id = #{toDoctorId}, update_time = NOW() "
            + "WHERE elder_id = #{elderId} AND deleted = 0 AND status IN (0, 1)")
    int transferActiveFollowPlans(@Param("elderId") Long elderId, @Param("toDoctorId") Long toDoctorId);

    @Update("UPDATE followup_task SET doctor_id = #{toDoctorId}, "
            + "nurse_id = COALESCE(#{toNurseId}, nurse_id) "
            + "WHERE elder_id = #{elderId} AND status IN (0, 1)")
    int transferOpenFollowupTasks(@Param("elderId") Long elderId,
                                  @Param("toDoctorId") Long toDoctorId,
                                  @Param("toNurseId") Long toNurseId);

    @Update("UPDATE intervention_record SET doctor_id = #{toDoctorId}, update_time = NOW() "
            + "WHERE elder_id = #{elderId} AND deleted = 0 AND status = 1")
    int transferActiveInterventions(@Param("elderId") Long elderId, @Param("toDoctorId") Long toDoctorId);

    @Update("UPDATE nursing_plan SET doctor_id = #{toDoctorId}, "
            + "nurse_id = COALESCE(#{toNurseId}, nurse_id), update_time = NOW() "
            + "WHERE elder_id = #{elderId} AND deleted = 0 AND status IN (0, 1)")
    int transferActiveNursingPlans(@Param("elderId") Long elderId,
                                   @Param("toDoctorId") Long toDoctorId,
                                   @Param("toNurseId") Long toNurseId);

    @Update("UPDATE nursing_record SET doctor_id = #{toDoctorId}, "
            + "nurse_id = COALESCE(#{toNurseId}, nurse_id), update_time = NOW() "
            + "WHERE elder_id = #{elderId} AND deleted = 0 AND report_status IN (0, 1)")
    int transferOpenNursingRecords(@Param("elderId") Long elderId,
                                   @Param("toDoctorId") Long toDoctorId,
                                   @Param("toNurseId") Long toNurseId);

    @Update("UPDATE ai_health_report SET doctor_id = #{toDoctorId} "
            + "WHERE elder_id = #{elderId} AND status = 0")
    int transferDraftReports(@Param("elderId") Long elderId, @Param("toDoctorId") Long toDoctorId);

    @Update("UPDATE elder_info SET doctor_id = #{toDoctorId}, "
            + "nurse_id = COALESCE(#{toNurseId}, nurse_id), update_time = NOW() "
            + "WHERE id = #{elderId} AND doctor_id = #{fromDoctorId} AND deleted = 0")
    int transferElderOwner(@Param("elderId") Long elderId,
                           @Param("fromDoctorId") Long fromDoctorId,
                           @Param("toDoctorId") Long toDoctorId,
                           @Param("toNurseId") Long toNurseId);
}
