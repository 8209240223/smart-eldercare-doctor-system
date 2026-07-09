package com.medical.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.ElderRiskProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 老人风险分层Mapper
 */
@Mapper
public interface ElderRiskProfileMapper extends BaseMapper<ElderRiskProfile> {

    /**
     * 根据风险等级查询老人列表(返回List)
     */
    @Select("SELECT erp.*, ei.name, ei.gender, ei.birth_date, ei.phone, ei.community, ei.doctor_id " +
            "FROM elder_risk_profile erp " +
            "LEFT JOIN elder_info ei ON erp.elder_id = ei.id " +
            "WHERE erp.risk_level = #{riskLevel} AND ei.deleted = 0 " +
            "ORDER BY erp.risk_score DESC")
    List<Map<String, Object>> selectByRiskLevel(@Param("riskLevel") Integer riskLevel);

    @Select("SELECT erp.*, ei.name, ei.gender, ei.birth_date, ei.phone, ei.community, ei.doctor_id " +
            "FROM elder_risk_profile erp " +
            "LEFT JOIN elder_info ei ON erp.elder_id = ei.id " +
            "WHERE ei.deleted = 0 " +
            "ORDER BY erp.risk_score DESC, erp.risk_level DESC")
    List<Map<String, Object>> selectAllWithElder();

    /**
     * 根据医生ID查询重点人群(返回List)
     */
    @Select("SELECT erp.*, ei.name, ei.gender, ei.birth_date, ei.phone, ei.community, ei.doctor_id " +
            "FROM elder_risk_profile erp " +
            "LEFT JOIN elder_info ei ON erp.elder_id = ei.id " +
            "WHERE erp.risk_level >= #{minLevel} AND ei.doctor_id = #{doctorId} AND ei.deleted = 0 " +
            "ORDER BY erp.risk_level DESC, erp.risk_score DESC")
    List<Map<String, Object>> selectByDoctorId(@Param("doctorId") Long doctorId, @Param("minLevel") Integer minLevel);

    /**
     * 统计各风险等级人数
     */
    @Select("SELECT risk_level, COUNT(*) as count FROM elder_risk_profile GROUP BY risk_level")
    List<Map<String, Object>> countByRiskLevel();
}
