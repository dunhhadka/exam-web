package com.datn.exam.model.dto;

import lombok.Data;

@Data
public class ExamSessionSetting {
    private AntiCheat antiCheat;
    private Proctoring proctoring;
    private Notifications notifications;

    @Data
    public static class AntiCheat {
        private Boolean blockCopyPaste;
        private Boolean blockDevTools;
        private Integer maxWindowBlurAllowed;
        private Integer maxExitFullscreenAllowed; // Số lần cho phép thoát fullscreen
    }

    @Data
    public static class Proctoring {
        private Boolean monitorEnabled; // có bật giám sát hay không
        private IdentityMode identityMode;
        private Boolean requireIdUpload; // yêu cầu upload giấy tờ tùy thân
        private Boolean screenRecording; // có quay màn hình không
    }

    @Data
    public static class Notifications {
        private Boolean sendResultEmail; // Có gửi mail thông báo kết quả không
        private ReleasePolicy releasePolicy; // Chiến lược gửi mail
    }

    public enum ReleasePolicy {
        IMMEDIATE,
        AFTER_EXAM_END
    }

    public enum IdentityMode {
        WEBCAM,
        UPLOAD,
        NONE
    }

}
