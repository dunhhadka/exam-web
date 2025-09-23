package com.datn.exam.repository.data.dao;

import com.datn.exam.repository.data.dto.QuestionTagDto;

import java.util.List;

public interface TagDao {
    public List<QuestionTagDto> findTagByQuestionIds(List<Long> questionIds);
}
