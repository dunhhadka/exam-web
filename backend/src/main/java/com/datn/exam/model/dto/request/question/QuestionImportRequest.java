package com.datn.exam.model.dto.request.question;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionImportRequest {
    private byte[] fileData;
}
