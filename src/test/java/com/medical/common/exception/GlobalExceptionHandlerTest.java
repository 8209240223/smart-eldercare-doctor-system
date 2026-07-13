package com.medical.common.exception;

import com.medical.common.result.R;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    @Test
    void responseStatusExceptionKeepsItsHttpStatus() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        ResponseEntity<R<?>> response = handler.handleResponseStatusException(
                new ResponseStatusException(HttpStatus.NOT_FOUND));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getCode());
        assertEquals("请求资源不存在", response.getBody().getMsg());
    }
}
