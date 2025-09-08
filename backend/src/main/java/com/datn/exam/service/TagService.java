package com.datn.exam.service;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.TagRequest;
import com.datn.exam.model.dto.request.TagSearchRequest;
import com.datn.exam.model.dto.response.TagResponse;

import java.util.List;

public interface TagService {
    TagResponse create(TagRequest request);
    void delete(IdsRequest request);
    List<TagResponse> search(TagSearchRequest request);
}
