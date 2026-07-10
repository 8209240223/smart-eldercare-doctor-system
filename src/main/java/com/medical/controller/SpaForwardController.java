package com.medical.controller;

import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class SpaForwardController {

    @GetMapping({"/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
    public String forwardFrontendRoute(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/")
                || uri.startsWith("/assets/")
                || uri.startsWith("/upload/")
                || uri.startsWith("/static/")
                || uri.startsWith("/pages/")
                || uri.startsWith("/css/")
                || uri.startsWith("/js/")
                || uri.startsWith("/img/")
                || uri.startsWith("/lib/")
                || uri.contains(".")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return "forward:/index.html";
    }
}
