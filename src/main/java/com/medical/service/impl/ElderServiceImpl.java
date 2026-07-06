package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.entity.SysUser;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.service.ElderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
public class ElderServiceImpl implements ElderService {

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private HealthRecordMapper healthRecordMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Override
    public Page<ElderInfo> listElders(Integer pageNum, Integer pageSize, String name, String community, Long doctorId) {
        Page<ElderInfo> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<ElderInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), ElderInfo::getName, name)
               .eq(StringUtils.hasText(community), ElderInfo::getCommunity, community)
               .eq(doctorId != null, ElderInfo::getDoctorId, doctorId)
               .orderByDesc(ElderInfo::getCreateTime);
        return elderInfoMapper.selectPage(page, wrapper);
    }

    @Override
    public ElderInfo getDetail(Long id) {
        ElderInfo elder = elderInfoMapper.selectById(id);
        if (elder == null) {
            throw new BusinessException(404, "老人信息不存在");
        }
        return elder;
    }

    @Override
    public Long create(ElderInfo elderInfo) {
        validateDuplicateIdCard(elderInfo.getIdCard(), null);
        if (elderInfo.getAccountStatus() == null) {
            elderInfo.setAccountStatus(1);
        }
        elderInfoMapper.insert(elderInfo);
        return elderInfo.getId();
    }

    @Override
    public void update(Long id, ElderInfo elderInfo) {
        ElderInfo existing = elderInfoMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "老人信息不存在");
        }
        validateDuplicateIdCard(elderInfo.getIdCard(), id);
        BeanUtil.copyProperties(elderInfo, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "deleted"));
        elderInfoMapper.updateById(existing);
    }

    @Override
    public void delete(Long id) {
        elderInfoMapper.deleteById(id);
    }

    @Override
    public HealthRecord getHealthRecord(Long elderId) {
        return healthRecordMapper.selectOne(
                new LambdaQueryWrapper<HealthRecord>().eq(HealthRecord::getElderId, elderId));
    }

    @Override
    public void saveHealthRecord(Long elderId, HealthRecord record) {
        record.setElderId(elderId);
        HealthRecord existing = healthRecordMapper.selectOne(
                new LambdaQueryWrapper<HealthRecord>().eq(HealthRecord::getElderId, elderId));
        if (existing != null) {
            BeanUtil.copyProperties(record, existing, CopyOptions.create()
                    .ignoreNullValue()
                    .setIgnoreProperties("id", "elderId", "recordNo", "createTime", "updateTime"));
            existing.setElderId(elderId);
            existing.setRecordNo(record.getRecordNo() != null ? record.getRecordNo() : existing.getRecordNo());
            healthRecordMapper.updateById(existing);
        } else {
            record.setRecordNo("HR" + System.currentTimeMillis());
            healthRecordMapper.insert(record);
        }
    }

    @Override
    public Map<String, Object> getStats() {
        Long total = elderInfoMapper.selectCount(null);
        Long maleCount = elderInfoMapper.selectCount(
                new LambdaQueryWrapper<ElderInfo>().eq(ElderInfo::getGender, 1));
        Long femaleCount = elderInfoMapper.selectCount(
                new LambdaQueryWrapper<ElderInfo>().eq(ElderInfo::getGender, 2));

        // 统计医生和护士数量
        Long doctorCount = sysUserMapper.selectCount(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUserType, 2));
        Long nurseCount = sysUserMapper.selectCount(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUserType, 3));

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("male", maleCount);
        stats.put("female", femaleCount);
        stats.put("doctorCount", doctorCount);
        stats.put("nurseCount", nurseCount);
        return stats;
    }

    private void validateDuplicateIdCard(String idCard, Long currentId) {
        if (!StringUtils.hasText(idCard)) {
            throw new BusinessException(400, "身份证号不能为空");
        }
        LambdaQueryWrapper<ElderInfo> wrapper = new LambdaQueryWrapper<ElderInfo>().eq(ElderInfo::getIdCard, idCard);
        if (currentId != null) {
            wrapper.ne(ElderInfo::getId, currentId);
        }
        Long count = elderInfoMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new BusinessException(400, "该身份证号已存在");
        }
    }
}
