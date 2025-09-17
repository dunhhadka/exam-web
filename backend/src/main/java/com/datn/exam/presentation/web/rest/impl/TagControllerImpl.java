package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.TagRequest;
import com.datn.exam.model.dto.request.TagSearchRequest;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.TagResponse;
import com.datn.exam.presentation.web.rest.TagController;
import com.datn.exam.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TagControllerImpl implements TagController {
    private final TagService tagService;

    @Override
    public Response<TagResponse> create(TagRequest request) {
        return Response.of(tagService.create(request));
    }

    @Override
    public Response<Boolean> delete(IdsRequest request) {
        tagService.delete(request);
        return Response.ok();
    }

    @Override
    public Response<List<TagResponse>> search(TagSearchRequest request) {
        return Response.of(tagService.search(request));
    }
}
