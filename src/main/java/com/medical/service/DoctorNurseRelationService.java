package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.medical.admin.dto.AdminUserRelationView;
import com.medical.common.exception.BusinessException;
import com.medical.entity.DoctorNurseRelation;
import com.medical.entity.SysUser;
import com.medical.mapper.DoctorNurseRelationMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class DoctorNurseRelationService {
    private static final int TARGET_RELATION_COUNT = 2;

    private final DoctorNurseRelationMapper relationMapper;
    private final SysUserMapper sysUserMapper;
    private final DoctorProfileService doctorProfileService;

    public DoctorNurseRelationService(DoctorNurseRelationMapper relationMapper,
                                      SysUserMapper sysUserMapper,
                                      DoctorProfileService doctorProfileService) {
        this.relationMapper = relationMapper;
        this.sysUserMapper = sysUserMapper;
        this.doctorProfileService = doctorProfileService;
    }

    @Transactional
    public void ensureFor(SysUser user) {
        if (!isActiveWorker(user)) {
            return;
        }
        if (Integer.valueOf(2).equals(user.getUserType())) {
            ensureDoctorRelations(user.getId());
        } else if (Integer.valueOf(3).equals(user.getUserType())) {
            ensureNurseRelations(user.getId());
        }
    }

    @Transactional
    public void ensureAllActiveAccounts() {
        sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .in(SysUser::getUserType, 2, 3)
                        .eq(SysUser::getStatus, 1)
                        .eq(SysUser::getDeleted, 0)
                        .orderByAsc(SysUser::getId))
                .forEach(this::ensureFor);
    }

    @Transactional
    public void ensureDemoRelationships() {
        String[][] pairs = {
                {"doctor01", "nurse01"}, {"doctor01", "nurse02"},
                {"doctor02", "nurse02"}, {"doctor02", "nurse03"},
                {"doctor03", "nurse01"}, {"doctor03", "nurse03"}
        };
        for (String[] pair : pairs) {
            SysUser doctor = findActiveByUsername(pair[0], 2);
            SysUser nurse = findActiveByUsername(pair[1], 3);
            if (doctor != null && nurse != null) {
                link(doctor.getId(), nurse.getId());
            }
        }
    }

    public List<AdminUserRelationView> listCollaborators(Long userId, Integer userType) {
        return relatedUsers(userId, userType).stream().map(user -> {
            AdminUserRelationView view = new AdminUserRelationView();
            view.setId(user.getId());
            view.setUsername(user.getUsername());
            view.setRealName(displayName(user));
            if (Integer.valueOf(2).equals(user.getUserType())) {
                view.setDepartment(doctorProfileService.departmentOf(user.getId()));
            }
            return view;
        }).toList();
    }

    @Transactional
    public void replaceRelations(Long userId, List<Long> collaboratorIds) {
        SysUser owner = requireActiveWorker(userId);
        Set<Long> normalized = collaboratorIds == null
                ? Set.of() : new LinkedHashSet<>(collaboratorIds);
        if (normalized.isEmpty()) {
            throw new BusinessException(400, "医生和护士至少需要保留一个协作关系");
        }
        int expectedType = Integer.valueOf(2).equals(owner.getUserType()) ? 3 : 2;
        for (Long collaboratorId : normalized) {
            requireActiveRole(collaboratorId, expectedType);
        }

        LambdaUpdateWrapper<DoctorNurseRelation> disable = new LambdaUpdateWrapper<>();
        if (Integer.valueOf(2).equals(owner.getUserType())) {
            disable.eq(DoctorNurseRelation::getDoctorId, owner.getId());
        } else {
            disable.eq(DoctorNurseRelation::getNurseId, owner.getId());
        }
        disable.set(DoctorNurseRelation::getStatus, 0)
                .set(DoctorNurseRelation::getUpdateTime, LocalDateTime.now());
        relationMapper.update(null, disable);

        for (Long collaboratorId : normalized) {
            if (Integer.valueOf(2).equals(owner.getUserType())) {
                link(owner.getId(), collaboratorId);
            } else {
                link(collaboratorId, owner.getId());
            }
        }
    }

    public Long chooseNurseForDoctor(Long doctorId, String seed, Long preferredNurseId) {
        SysUser doctor = requireActiveRole(doctorId, 2);
        ensureFor(doctor);
        List<SysUser> nurses = relatedUsers(doctorId, 2);
        if (preferredNurseId != null && nurses.stream().anyMatch(user -> preferredNurseId.equals(user.getId()))) {
            return preferredNurseId;
        }
        return choose(nurses, seed);
    }

    public Long chooseDoctorForNurse(Long nurseId, String seed) {
        SysUser nurse = requireActiveRole(nurseId, 3);
        ensureFor(nurse);
        return choose(relatedUsers(nurseId, 3), seed);
    }

    public boolean isLinked(Long doctorId, Long nurseId) {
        if (doctorId == null || nurseId == null) {
            return false;
        }
        return relationMapper.selectCount(new LambdaQueryWrapper<DoctorNurseRelation>()
                .eq(DoctorNurseRelation::getDoctorId, doctorId)
                .eq(DoctorNurseRelation::getNurseId, nurseId)
                .eq(DoctorNurseRelation::getStatus, 1)) > 0;
    }

    private void ensureDoctorRelations(Long doctorId) {
        List<SysUser> related = relatedUsers(doctorId, 2);
        if (related.size() >= TARGET_RELATION_COUNT) {
            return;
        }
        Set<Long> existingIds = related.stream().map(SysUser::getId)
                .collect(java.util.stream.Collectors.toSet());
        List<SysUser> candidates = activeUsers(3).stream()
                .filter(user -> !existingIds.contains(user.getId()))
                .sorted(java.util.Comparator.comparingLong(user -> relationLoad(user.getId(), 3)))
                .toList();
        int missing = Math.min(TARGET_RELATION_COUNT - related.size(), candidates.size());
        for (int index = 0; index < missing; index++) {
            link(doctorId, candidates.get(index).getId());
        }
    }

    private void ensureNurseRelations(Long nurseId) {
        List<SysUser> related = relatedUsers(nurseId, 3);
        if (related.size() >= TARGET_RELATION_COUNT) {
            return;
        }
        Set<Long> existingIds = related.stream().map(SysUser::getId)
                .collect(java.util.stream.Collectors.toSet());
        List<SysUser> candidates = activeUsers(2).stream()
                .filter(user -> !existingIds.contains(user.getId()))
                .sorted(java.util.Comparator.comparingLong(user -> relationLoad(user.getId(), 2)))
                .toList();
        int missing = Math.min(TARGET_RELATION_COUNT - related.size(), candidates.size());
        for (int index = 0; index < missing; index++) {
            link(candidates.get(index).getId(), nurseId);
        }
    }

    private List<SysUser> relatedUsers(Long userId, Integer userType) {
        if (userId == null || userType == null) {
            return List.of();
        }
        LambdaQueryWrapper<DoctorNurseRelation> wrapper = new LambdaQueryWrapper<>();
        if (Integer.valueOf(2).equals(userType)) {
            wrapper.eq(DoctorNurseRelation::getDoctorId, userId);
        } else if (Integer.valueOf(3).equals(userType)) {
            wrapper.eq(DoctorNurseRelation::getNurseId, userId);
        } else {
            return List.of();
        }
        List<Long> ids = relationMapper.selectList(wrapper.eq(DoctorNurseRelation::getStatus, 1)
                        .orderByAsc(DoctorNurseRelation::getId))
                .stream()
                .map(relation -> Integer.valueOf(2).equals(userType)
                        ? relation.getNurseId() : relation.getDoctorId())
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        int expectedType = Integer.valueOf(2).equals(userType) ? 3 : 2;
        return sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .in(SysUser::getId, ids)
                .eq(SysUser::getUserType, expectedType)
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getDeleted, 0)
                .orderByAsc(SysUser::getRealName)
                .orderByAsc(SysUser::getId));
    }

    private List<SysUser> activeUsers(Integer userType) {
        return sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserType, userType)
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getDeleted, 0)
                .orderByAsc(SysUser::getId));
    }

    private long relationLoad(Long userId, Integer userType) {
        LambdaQueryWrapper<DoctorNurseRelation> wrapper = new LambdaQueryWrapper<DoctorNurseRelation>()
                .eq(DoctorNurseRelation::getStatus, 1);
        if (Integer.valueOf(2).equals(userType)) {
            wrapper.eq(DoctorNurseRelation::getDoctorId, userId);
        } else {
            wrapper.eq(DoctorNurseRelation::getNurseId, userId);
        }
        return relationMapper.selectCount(wrapper);
    }

    private void link(Long doctorId, Long nurseId) {
        DoctorNurseRelation relation = relationMapper.selectOne(new LambdaQueryWrapper<DoctorNurseRelation>()
                .eq(DoctorNurseRelation::getDoctorId, doctorId)
                .eq(DoctorNurseRelation::getNurseId, nurseId)
                .last("LIMIT 1"));
        if (relation == null) {
            relation = new DoctorNurseRelation();
            relation.setDoctorId(doctorId);
            relation.setNurseId(nurseId);
            relation.setStatus(1);
            relation.setCreateTime(LocalDateTime.now());
            relation.setUpdateTime(LocalDateTime.now());
            relationMapper.insert(relation);
        } else if (!Integer.valueOf(1).equals(relation.getStatus())) {
            relation.setStatus(1);
            relation.setUpdateTime(LocalDateTime.now());
            relationMapper.updateById(relation);
        }
    }

    private SysUser findActiveByUsername(String username, Integer userType) {
        return sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .eq(SysUser::getUserType, userType)
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getDeleted, 0)
                .last("LIMIT 1"));
    }

    private SysUser requireActiveWorker(Long userId) {
        SysUser user = userId == null ? null : sysUserMapper.selectById(userId);
        if (!isActiveWorker(user)) {
            throw new BusinessException(400, "协作关系仅支持正常启用的医生或护士账号");
        }
        return user;
    }

    private SysUser requireActiveRole(Long userId, Integer userType) {
        SysUser user = userId == null ? null : sysUserMapper.selectById(userId);
        if (!isActiveWorker(user) || !userType.equals(user.getUserType())) {
            throw new BusinessException(400, userType == 2
                    ? "请选择正常启用的医生账号" : "请选择正常启用的护士账号");
        }
        return user;
    }

    private boolean isActiveWorker(SysUser user) {
        return user != null && user.getId() != null
                && (Integer.valueOf(2).equals(user.getUserType()) || Integer.valueOf(3).equals(user.getUserType()))
                && Integer.valueOf(1).equals(user.getStatus())
                && !Integer.valueOf(1).equals(user.getDeleted());
    }

    private Long choose(List<SysUser> users, String seed) {
        if (users.isEmpty()) {
            return null;
        }
        String value = StringUtils.hasText(seed) ? seed : "default";
        return users.get(Math.floorMod(value.hashCode(), users.size())).getId();
    }

    private String displayName(SysUser user) {
        return StringUtils.hasText(user.getRealName()) ? user.getRealName().trim() : user.getUsername();
    }
}
