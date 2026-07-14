package com.medical.common.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import com.medical.service.DoctorNurseRelationService;
import com.medical.service.DoctorProfileService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(40)
public class DoctorNurseRelationMigration implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;
    private final SysUserMapper sysUserMapper;
    private final DoctorProfileService doctorProfileService;
    private final DoctorNurseRelationService relationService;

    public DoctorNurseRelationMigration(JdbcTemplate jdbcTemplate,
                                        SysUserMapper sysUserMapper,
                                        DoctorProfileService doctorProfileService,
                                        DoctorNurseRelationService relationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.sysUserMapper = sysUserMapper;
        this.doctorProfileService = doctorProfileService;
        this.relationService = relationService;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureDoctorPhoneColumn();
        createRelationTable();
        ensureDoctorProfiles();
        restoreRelationsFromExistingElders();
        relationService.ensureDemoRelationships();
        relationService.ensureAllActiveAccounts();
    }

    private void ensureDoctorPhoneColumn() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() "
                        + "AND TABLE_NAME = 'doctor_info' AND COLUMN_NAME = 'phone'", Integer.class);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE doctor_info ADD COLUMN phone VARCHAR(20) DEFAULT NULL "
                    + "COMMENT '联系电话' AFTER gender");
        }
    }

    private void createRelationTable() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS doctor_nurse_relation ("
                + "id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',"
                + "doctor_id BIGINT NOT NULL COMMENT '医生用户ID',"
                + "nurse_id BIGINT NOT NULL COMMENT '护士用户ID',"
                + "status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0停用 1有效',"
                + "create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',"
                + "update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',"
                + "PRIMARY KEY (id),"
                + "UNIQUE KEY uk_doctor_nurse (doctor_id, nurse_id),"
                + "KEY idx_relation_doctor (doctor_id, status),"
                + "KEY idx_relation_nurse (nurse_id, status)"
                + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医生护士多对多协作关系表'");
    }

    private void ensureDoctorProfiles() {
        sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUserType, 2)
                        .eq(SysUser::getStatus, 1)
                        .eq(SysUser::getDeleted, 0)
                        .orderByAsc(SysUser::getId))
                .forEach(user -> doctorProfileService.ensureProfile(user, null));
    }

    private void restoreRelationsFromExistingElders() {
        jdbcTemplate.update("INSERT INTO doctor_nurse_relation "
                + "(doctor_id, nurse_id, status, create_time, update_time) "
                + "SELECT DISTINCT e.doctor_id, e.nurse_id, 1, NOW(), NOW() FROM elder_info e "
                + "JOIN sys_user doctor ON doctor.id = e.doctor_id AND doctor.user_type = 2 "
                + "AND doctor.status = 1 AND doctor.deleted = 0 "
                + "JOIN sys_user nurse ON nurse.id = e.nurse_id AND nurse.user_type = 3 "
                + "AND nurse.status = 1 AND nurse.deleted = 0 "
                + "WHERE e.deleted = 0 AND e.doctor_id IS NOT NULL AND e.nurse_id IS NOT NULL "
                + "ON DUPLICATE KEY UPDATE status = 1, update_time = NOW()");
    }
}
