package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.common.exception.BusinessException;
import com.medical.dto.DoctorOptionView;
import com.medical.entity.DoctorInfo;
import com.medical.entity.SysUser;
import com.medical.mapper.DoctorInfoMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DoctorProfileService {
    public static final String DEFAULT_DEPARTMENT = "全科医学科";

    private final DoctorInfoMapper doctorInfoMapper;
    private final SysUserMapper sysUserMapper;

    public DoctorProfileService(DoctorInfoMapper doctorInfoMapper, SysUserMapper sysUserMapper) {
        this.doctorInfoMapper = doctorInfoMapper;
        this.sysUserMapper = sysUserMapper;
    }

    @Transactional
    public DoctorInfo ensureProfile(SysUser user, String requestedDepartment) {
        if (user == null || user.getId() == null || !Integer.valueOf(2).equals(user.getUserType())) {
            return null;
        }
        String department = normalizeDepartment(requestedDepartment);
        DoctorInfo profile = findByUserId(user.getId());
        if (profile == null) {
            profile = new DoctorInfo();
            profile.setUserId(user.getId());
            profile.setName(displayName(user));
            profile.setGender(1);
            profile.setPhone(user.getPhone());
            profile.setTitle("医师");
            profile.setDepartment(department);
            profile.setStatus(1);
            profile.setCreateTime(LocalDateTime.now());
            profile.setUpdateTime(LocalDateTime.now());
            doctorInfoMapper.insert(profile);
            return profile;
        }

        boolean changed = false;
        if (!StringUtils.hasText(profile.getName())) {
            profile.setName(displayName(user));
            changed = true;
        }
        if (!StringUtils.hasText(profile.getPhone()) && StringUtils.hasText(user.getPhone())) {
            profile.setPhone(user.getPhone());
            changed = true;
        }
        if (StringUtils.hasText(requestedDepartment)
                && !department.equals(profile.getDepartment())) {
            profile.setDepartment(department);
            changed = true;
        } else if (!StringUtils.hasText(profile.getDepartment())) {
            profile.setDepartment(DEFAULT_DEPARTMENT);
            changed = true;
        }
        if (profile.getStatus() == null) {
            profile.setStatus(1);
            changed = true;
        }
        if (changed) {
            profile.setUpdateTime(LocalDateTime.now());
            doctorInfoMapper.updateById(profile);
        }
        return profile;
    }

    @Transactional
    public void updateDepartment(Long userId, String department) {
        SysUser user = requireActiveDoctor(userId);
        ensureProfile(user, department);
    }

    public DoctorInfo findByUserId(Long userId) {
        if (userId == null) {
            return null;
        }
        return doctorInfoMapper.selectOne(new LambdaQueryWrapper<DoctorInfo>()
                .eq(DoctorInfo::getUserId, userId)
                .last("LIMIT 1"));
    }

    public String departmentOf(Long userId) {
        DoctorInfo profile = findByUserId(userId);
        return profile == null || !StringUtils.hasText(profile.getDepartment())
                ? DEFAULT_DEPARTMENT : profile.getDepartment();
    }

    public List<DoctorOptionView> listActiveDoctorOptions(Long excludedUserId) {
        return sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUserType, 2)
                        .eq(SysUser::getStatus, 1)
                        .eq(SysUser::getDeleted, 0)
                        .ne(excludedUserId != null, SysUser::getId, excludedUserId)
                        .orderByAsc(SysUser::getRealName)
                        .orderByAsc(SysUser::getId))
                .stream()
                .map(this::toOption)
                .toList();
    }

    public SysUser requireActiveDoctor(Long userId) {
        SysUser user = userId == null ? null : sysUserMapper.selectById(userId);
        if (user == null || !Integer.valueOf(2).equals(user.getUserType())
                || !Integer.valueOf(1).equals(user.getStatus())
                || Integer.valueOf(1).equals(user.getDeleted())) {
            throw new BusinessException(400, "请选择正常启用的医生账号");
        }
        return user;
    }

    private DoctorOptionView toOption(SysUser user) {
        DoctorOptionView option = new DoctorOptionView();
        option.setId(user.getId());
        option.setUsername(user.getUsername());
        option.setRealName(displayName(user));
        option.setDepartment(departmentOf(user.getId()));
        return option;
    }

    private String normalizeDepartment(String department) {
        return StringUtils.hasText(department) ? department.trim() : DEFAULT_DEPARTMENT;
    }

    private String displayName(SysUser user) {
        return StringUtils.hasText(user.getRealName()) ? user.getRealName().trim() : user.getUsername();
    }
}
