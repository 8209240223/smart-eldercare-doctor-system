package com.medical.service;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.SysUser;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 老人主数据引用校验服务。
 */
@Service
public class ElderReferenceService {

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    public ElderInfo requireActive(Long elderId) {
        if (elderId == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (elderId <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }

        ElderInfo elder = elderInfoMapper.selectById(elderId);
        if (elder == null || Integer.valueOf(1).equals(elder.getDeleted())) {
            throw new BusinessException(404, "老人不存在或已删除");
        }
        if (Integer.valueOf(0).equals(elder.getAccountStatus())) {
            throw new BusinessException(400, "老人账号已停用，不能执行该操作");
        }
        return elder;
    }

    public void requireActiveDoctor(Long doctorId) {
        if (doctorId == null) {
            throw new BusinessException(400, "该老人尚未分配责任医生");
        }
        SysUser doctor = sysUserMapper.selectById(doctorId);
        if (doctor == null
                || !Integer.valueOf(2).equals(doctor.getUserType())
                || !Integer.valueOf(1).equals(doctor.getStatus())
                || Integer.valueOf(1).equals(doctor.getDeleted())) {
            throw new BusinessException(400, "责任医生必须是启用中的真实医生账号");
        }
    }
}
