package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.ReferralOrder;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.ReferralOrderMapper;
import com.medical.service.ReferralService;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReferralServiceImpl implements ReferralService {

    @Autowired
    private ReferralOrderMapper referralOrderMapper;

    @Autowired
    private TimelineService timelineService;

    @Override
    public ReferralOrder createReferral(ReferralOrder order) {
        // 生成转诊编号
        String no = "REF" + System.currentTimeMillis();
        order.setReferralNo(no);
        order.setStatus(0);
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.insert(order);

        // 写入时间轴
        TimelineEvent event = new TimelineEvent();
        event.setElderId(order.getElderId());
        event.setEventType(7); // 转诊
        String typeLabel = order.getReferralType() == 1 ? "上转" : "下转";
        event.setEventTitle(typeLabel + "转诊: " + order.getFromOrg() + " → " + order.getToOrg());
        event.setEventContent("诊断: " + order.getDiagnosis() + ", 原因: " + order.getReferralReason());
        event.setSourceType("referral");
        event.setSourceId(order.getId());
        event.setDoctorId(order.getFromDoctorId());
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);

        return order;
    }

    @Override
    public void acceptReferral(Long id) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        order.setStatus(1);
        order.setAcceptTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
    }

    @Override
    public void completeReferral(Long id, String dischargeSummary) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        order.setStatus(3);
        order.setDischargeSummary(dischargeSummary);
        order.setCompleteTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);

        // 写入时间轴 - 出院/结案
        TimelineEvent event = new TimelineEvent();
        event.setElderId(order.getElderId());
        event.setEventType(9); // 出院
        event.setEventTitle("转诊完成: " + order.getReferralNo());
        event.setEventContent("出院小结: " + dischargeSummary);
        event.setSourceType("referral");
        event.setSourceId(order.getId());
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);
    }

    @Override
    public void rejectReferral(Long id, String reason) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        order.setStatus(4);
        order.setRejectReason(reason);
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
    }

    @Override
    public void cancelReferral(Long id) {
        ReferralOrder order = referralOrderMapper.selectById(id);
        order.setStatus(5);
        order.setUpdateTime(LocalDateTime.now());
        referralOrderMapper.updateById(order);
    }

    @Override
    public Page<ReferralOrder> listReferrals(Integer pageNum, Integer pageSize, Long doctorId, Integer status, Integer referralType) {
        LambdaQueryWrapper<ReferralOrder> wrapper = new LambdaQueryWrapper<>();
        if (doctorId != null) {
            wrapper.and(w -> w.eq(ReferralOrder::getFromDoctorId, doctorId).or().eq(ReferralOrder::getToDoctorId, doctorId));
        }
        if (status != null) {
            wrapper.eq(ReferralOrder::getStatus, status);
        }
        if (referralType != null) {
            wrapper.eq(ReferralOrder::getReferralType, referralType);
        }
        wrapper.orderByDesc(ReferralOrder::getCreateTime);
        return referralOrderMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public ReferralOrder getDetail(Long id) {
        return referralOrderMapper.selectById(id);
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        // 待接收
        LambdaQueryWrapper<ReferralOrder> w0 = new LambdaQueryWrapper<>();
        w0.eq(ReferralOrder::getStatus, 0);
        stats.put("pending", referralOrderMapper.selectCount(w0));
        // 处理中
        LambdaQueryWrapper<ReferralOrder> w1 = new LambdaQueryWrapper<>();
        w1.in(ReferralOrder::getStatus, 1, 2);
        stats.put("processing", referralOrderMapper.selectCount(w1));
        // 上转数
        LambdaQueryWrapper<ReferralOrder> wUp = new LambdaQueryWrapper<>();
        wUp.eq(ReferralOrder::getReferralType, 1);
        stats.put("upCount", referralOrderMapper.selectCount(wUp));
        // 下转数
        LambdaQueryWrapper<ReferralOrder> wDown = new LambdaQueryWrapper<>();
        wDown.eq(ReferralOrder::getReferralType, 2);
        stats.put("downCount", referralOrderMapper.selectCount(wDown));
        // 已完成
        LambdaQueryWrapper<ReferralOrder> wDone = new LambdaQueryWrapper<>();
        wDone.eq(ReferralOrder::getStatus, 3);
        stats.put("completed", referralOrderMapper.selectCount(wDone));
        return stats;
    }
}
