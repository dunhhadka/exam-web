package com.datn.exam.service;

import com.datn.exam.model.dto.BaseMailContext;
import com.datn.exam.model.dto.OtpMailContext;

public interface EmailService {
    void sendMail(BaseMailContext context);
}
