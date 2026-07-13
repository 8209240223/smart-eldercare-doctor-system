package com.medical.controller;

import com.medical.common.exception.BusinessException;
import com.medical.service.ReviewService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ReviewControllerRoutingTest {

    @Test
    void pendingRecordsUseCurrentDoctorWhileAdminKeepsRegulatoryView() {
        ReviewService reviewService = mock(ReviewService.class);
        ReviewController controller = new ReviewController();
        ReflectionTestUtils.setField(controller, "reviewService", reviewService);

        MockHttpServletRequest doctorRequest = new MockHttpServletRequest();
        doctorRequest.setAttribute("currentUserType", 2);
        doctorRequest.setAttribute("currentUserId", 21L);
        controller.listPendingRecords(1, 10, doctorRequest);

        MockHttpServletRequest adminRequest = new MockHttpServletRequest();
        adminRequest.setAttribute("currentUserType", 1);
        adminRequest.setAttribute("currentUserId", 1L);
        controller.listPendingRecords(2, 15, adminRequest);

        verify(reviewService).listPendingRecords(1, 10, 21L);
        verify(reviewService).listPendingRecords(2, 15, null);
    }

    @Test
    void approvingRecordWithoutAuthenticatedUserNeverFallsBackToFixedDoctor() {
        ReviewService reviewService = mock(ReviewService.class);
        ReviewController controller = new ReviewController();
        ReflectionTestUtils.setField(controller, "reviewService", reviewService);

        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThrows(BusinessException.class,
                () -> controller.approveRecord(7L, null, request));
    }
}
