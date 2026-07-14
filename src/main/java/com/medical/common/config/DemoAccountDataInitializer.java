package com.medical.common.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import com.medical.service.UserDemoDataService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Order(200)
public class DemoAccountDataInitializer implements ApplicationRunner {
    private static final Set<String> DEMO_ACCOUNTS = Set.of(
            "doctor01", "doctor02", "doctor03", "nurse01", "nurse02", "nurse03");

    private final SysUserMapper sysUserMapper;
    private final UserDemoDataService userDemoDataService;

    public DemoAccountDataInitializer(SysUserMapper sysUserMapper, UserDemoDataService userDemoDataService) {
        this.sysUserMapper = sysUserMapper;
        this.userDemoDataService = userDemoDataService;
    }

    @Override
    public void run(ApplicationArguments args) {
        sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .in(SysUser::getUsername, DEMO_ACCOUNTS)
                        .eq(SysUser::getStatus, 1)
                        .eq(SysUser::getDeleted, 0))
                .forEach(userDemoDataService::ensureFor);
    }
}
