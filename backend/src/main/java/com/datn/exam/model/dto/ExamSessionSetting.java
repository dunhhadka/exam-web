package com.datn.exam.model.dto;

import lombok.Data;

@Data
public class ExamSessionSetting {
    private AntiCheat antiCheat;
    private Proctoring proctoring;
    private NotificationSetting notifications;

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

    public enum IdentityMode {
        WEBCAM,
        UPLOAD,
        NONE
    }

}
