package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.DisabilityStatusSupport;
import com.medical.entity.ElderInfo;
import com.medical.entity.FollowPlan;
import com.medical.entity.HealthRecord;
import com.medical.entity.SysUser;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.service.ElderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class ElderServiceImpl implements ElderService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^1\\d{10}$");
    private static final int[] ID_CARD_WEIGHT = {7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2};
    private static final char[] ID_CARD_CHECK_CODE = {'1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'};

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private HealthRecordMapper healthRecordMapper;

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Override
    public Page<ElderInfo> listElders(Integer pageNum, Integer pageSize, Long elderId, String name, String community, Long doctorId, Integer diseaseType) {
        Page<ElderInfo> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<ElderInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(elderId != null, ElderInfo::getId, elderId)
               .like(StringUtils.hasText(name), ElderInfo::getName, name)
               .eq(StringUtils.hasText(community), ElderInfo::getCommunity, community)
               .eq(doctorId != null, ElderInfo::getDoctorId, doctorId);
        if (diseaseType != null) {
            List<Long> elderIds = followPlanMapper.selectList(new LambdaQueryWrapper<FollowPlan>()
                            .eq(FollowPlan::getDiseaseType, diseaseType))
                    .stream()
                    .map(FollowPlan::getElderId)
                    .filter(id -> id != null)
                    .distinct()
                    .collect(Collectors.toList());
            if (elderIds.isEmpty()) {
                return page;
            }
            wrapper.in(ElderInfo::getId, elderIds);
        }
        wrapper.orderByAsc(ElderInfo::getId);
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
        assignNurseIfMissing(elderInfo);
        validateElder(elderInfo, null);
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
        validateElder(elderInfo, id);
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
        HealthRecord record = healthRecordMapper.selectOne(
                new LambdaQueryWrapper<HealthRecord>().eq(HealthRecord::getElderId, elderId));
        if (record != null && !DisabilityStatusSupport.isValid(record.getDisabilityStatus())) {
            record.setDisabilityStatus(null);
        }
        return record;
    }

    @Override
    public void saveHealthRecord(Long elderId, HealthRecord record) {
        validateHealthRecord(record);
        record.setDisabilityStatus(DisabilityStatusSupport.normalize(record.getDisabilityStatus()));
        record.setElderId(elderId);
        HealthRecord existing = healthRecordMapper.selectOne(
                new LambdaQueryWrapper<HealthRecord>().eq(HealthRecord::getElderId, elderId));
        if (existing != null) {
            BeanUtil.copyProperties(record, existing, CopyOptions.create()
                    .ignoreNullValue()
                    .setIgnoreProperties("id", "elderId", "recordNo", "createTime", "updateTime"));
            existing.setElderId(elderId);
            existing.setRecordNo(record.getRecordNo() != null ? record.getRecordNo() : existing.getRecordNo());
            existing.setDisabilityStatus(record.getDisabilityStatus());
            healthRecordMapper.updateById(existing);
        } else {
            record.setRecordNo("HR" + System.currentTimeMillis());
            healthRecordMapper.insert(record);
        }
    }

    private void validateHealthRecord(HealthRecord record) {
        if (record == null) {
            throw new BusinessException(400, "健康档案不能为空");
        }
        if (record.getLivingAbility() != null
                && (record.getLivingAbility() < 1 || record.getLivingAbility() > 4)) {
            throw new BusinessException(400, "生活自理能力只能选择完全自理、基本自理、部分依赖或完全依赖");
        }
        if (!DisabilityStatusSupport.isValid(record.getDisabilityStatus())) {
            throw new BusinessException(400, "残疾/失能情况必须从系统提供的选项中选择");
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

    @Override
    public List<Map<String, Object>> listActiveDoctorOptions() {
        return sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUserType, 2)
                        .eq(SysUser::getStatus, 1)
                        .orderByAsc(SysUser::getRealName)
                        .orderByAsc(SysUser::getUsername))
                .stream()
                .map(user -> {
                    Map<String, Object> option = new LinkedHashMap<>();
                    option.put("id", user.getId());
                    option.put("realName", user.getRealName());
                    option.put("username", user.getUsername());
                    return option;
                })
                .collect(Collectors.toList());
    }

    private void validateElder(ElderInfo elderInfo, Long currentId) {
        if (elderInfo == null) {
            throw new BusinessException(400, "老人信息不能为空");
        }
        String normalizedIdCard = normalizeIdCard(elderInfo.getIdCard());
        elderInfo.setIdCard(normalizedIdCard);
        validateIdCard(normalizedIdCard);
        LocalDate idCardBirthDate = LocalDate.parse(normalizedIdCard.substring(6, 14), java.time.format.DateTimeFormatter.BASIC_ISO_DATE);
        if (elderInfo.getBirthDate() == null) {
            elderInfo.setBirthDate(idCardBirthDate);
        } else if (!elderInfo.getBirthDate().equals(idCardBirthDate)) {
            throw new BusinessException(400, "出生日期必须与身份证号中的出生日期一致");
        }
        validateDuplicateIdCard(elderInfo.getIdCard(), currentId);
        if (elderInfo.getBirthDate() != null && elderInfo.getBirthDate().isAfter(LocalDate.now())) {
            throw new BusinessException(400, "出生日期不能晚于今天");
        }
        if (StringUtils.hasText(elderInfo.getPhone()) && !PHONE_PATTERN.matcher(elderInfo.getPhone()).matches()) {
            throw new BusinessException(400, "联系电话格式不正确");
        }
        if (StringUtils.hasText(elderInfo.getEmergencyPhone()) && !PHONE_PATTERN.matcher(elderInfo.getEmergencyPhone()).matches()) {
            throw new BusinessException(400, "紧急联系电话格式不正确");
        }
        if (elderInfo.getDoctorId() != null && elderInfo.getDoctorId() <= 0) {
            throw new BusinessException(400, "责任医生ID必须为正整数");
        }
        if (elderInfo.getDoctorId() != null) {
            SysUser doctor = sysUserMapper.selectById(elderInfo.getDoctorId());
            if (doctor == null
                    || !Integer.valueOf(2).equals(doctor.getUserType())
                    || !Integer.valueOf(1).equals(doctor.getStatus())
                    || Integer.valueOf(1).equals(doctor.getDeleted())) {
                throw new BusinessException(400, "责任医生必须选择启用中的真实医生账号");
            }
        }
        validateNurse(elderInfo.getNurseId());
    }

    private void assignNurseIfMissing(ElderInfo elderInfo) {
        if (elderInfo == null || elderInfo.getNurseId() != null) {
            return;
        }
        List<SysUser> nurses = sysUserMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserType, 3)
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getDeleted, 0)
                .orderByAsc(SysUser::getId));
        if (!nurses.isEmpty()) {
            String seed = elderInfo.getIdCard() == null ? elderInfo.getName() : elderInfo.getIdCard();
            elderInfo.setNurseId(nurses.get(Math.floorMod(seed.hashCode(), nurses.size())).getId());
        }
    }

    private void validateNurse(Long nurseId) {
        if (nurseId == null) {
            return;
        }
        SysUser nurse = sysUserMapper.selectById(nurseId);
        if (nurse == null || !Integer.valueOf(3).equals(nurse.getUserType())
                || !Integer.valueOf(1).equals(nurse.getStatus())
                || Integer.valueOf(1).equals(nurse.getDeleted())) {
            throw new BusinessException(400, "责任护士必须选择启用中的真实护士账号");
        }
    }

    private void validateIdCard(String idCard) {
        if (!StringUtils.hasText(idCard)) {
            throw new BusinessException(400, "身份证号不能为空");
        }
        String normalized = normalizeIdCard(idCard);
        if (!normalized.matches("^\\d{17}[0-9X]$")) {
            throw new BusinessException(400, "身份证号必须为18位，前17位为数字，最后一位为数字或X");
        }
        validateIdCardDate(normalized);
        int sum = 0;
        for (int i = 0; i < 17; i++) {
            sum += (normalized.charAt(i) - '0') * ID_CARD_WEIGHT[i];
        }
        char expected = ID_CARD_CHECK_CODE[sum % 11];
        if (normalized.charAt(17) != expected) {
            throw new BusinessException(400, "身份证号校验位不正确");
        }
    }

    private String normalizeIdCard(String idCard) {
        return idCard == null ? null : idCard.trim().toUpperCase();
    }

    private void validateIdCardDate(String idCard) {
        int year = Integer.parseInt(idCard.substring(6, 10));
        int month = Integer.parseInt(idCard.substring(10, 12));
        int day = Integer.parseInt(idCard.substring(12, 14));
        try {
            LocalDate birthDate = LocalDate.of(year, month, day);
            if (birthDate.isAfter(LocalDate.now())) {
                throw new BusinessException(400, "身份证出生日期不能晚于今天");
            }
        } catch (DateTimeException e) {
            throw new BusinessException(400, "身份证出生日期不存在");
        }
    }

    private void validateDuplicateIdCard(String idCard, Long currentId) {
        if (!StringUtils.hasText(idCard)) {
            throw new BusinessException(400, "身份证号不能为空");
        }
        LambdaQueryWrapper<ElderInfo> wrapper = new LambdaQueryWrapper<ElderInfo>().eq(ElderInfo::getIdCard, idCard.trim().toUpperCase());
        if (currentId != null) {
            wrapper.ne(ElderInfo::getId, currentId);
        }
        Long count = elderInfoMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new BusinessException(400, "该身份证号已存在");
        }
    }
}
