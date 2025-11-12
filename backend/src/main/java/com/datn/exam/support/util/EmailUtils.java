package com.datn.exam.support.util;

import com.datn.exam.support.constants.MailVariableConstants;

public class EmailUtils {
    public static boolean isValidEmail(String email) {
        return email != null && MailVariableConstants.EMAIL_PATTERN.matcher(email.trim()).matches();
    }
}