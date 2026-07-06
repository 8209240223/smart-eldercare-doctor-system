package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.ReferralOrder;

import java.util.Map;

/**
 * 转诊服务接口
 */
public interface ReferralService {

    ReferralOrder createReferral(ReferralOrder order);

    void acceptReferral(Long id, Long currentUserId, Integer currentUserType);

    void completeReferral(Long id, String dischargeSummary, Long currentUserId, Integer currentUserType);

    void rejectReferral(Long id, String reason, Long currentUserId, Integer currentUserType);

    void cancelReferral(Long id, String reason, Long currentUserId, Integer currentUserType);

    Page<ReferralOrder> listReferrals(Integer pageNum, Integer pageSize, Long doctorId, Integer status, Integer referralType);

    ReferralOrder getDetail(Long id);

    Map<String, Object> getStats();
}
