package com.medical;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 智慧医养大数据公共服务平台医生服务系统 启动类
 */
@SpringBootApplication
@MapperScan("com.medical.mapper")
@EnableScheduling
public class MedicalDoctorApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicalDoctorApplication.class, args);
        System.out.println("========================================");
        System.out.println("  智慧医养医生服务系统启动成功！");
        System.out.println("  访问地址: http://localhost:8080");
        System.out.println("========================================");
    }
}
