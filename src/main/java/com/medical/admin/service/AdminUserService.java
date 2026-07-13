package com.medical.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.admin.dto.AdminCreateUserRequest;
import com.medical.admin.dto.AdminResetPasswordRequest;
import com.medical.admin.dto.AdminReviewRequest;
import com.medical.admin.dto.AdminUserQuery;
import com.medical.admin.dto.AdminUserStatistics;
import com.medical.admin.dto.AdminUserView;

public interface AdminUserService {

    Page<AdminUserView> listUsers(AdminUserQuery query);

    Long createUser(AdminCreateUserRequest request);

    void reviewUser(Long userId, AdminReviewRequest request);

    void approveUser(Long userId);

    void rejectUser(Long userId);

    void banUser(Long userId, Long operatorId);

    void unbanUser(Long userId);

    void resetPassword(Long userId, AdminResetPasswordRequest request);

    void forceLogout(Long userId);

    AdminUserStatistics getStatistics();
}
