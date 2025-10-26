package com.datn.exam.support.util;

import jakarta.servlet.http.HttpServletRequest;

public class RequestUtils {
    public static String getClientIp(HttpServletRequest servletRequest) {
        String[] headers = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR"
        };

        for (String header : headers) {
            String ip = servletRequest.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0];
            }
        }

        return servletRequest.getRemoteAddr();
    }
}
