package com.medical.service;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.mapper.ElderInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 老人主数据引用校验服务。
 */
@Service
public class ElderReferenceService {

    @Autowired
    private ElderInfoMapper elderInfoMapper;

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
}
