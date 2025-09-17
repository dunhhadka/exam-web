package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.TagRequest;
import com.datn.exam.model.dto.request.TagSearchRequest;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.TagResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/tag")
public interface TagController {

    @PostMapping("/create")
    Response<TagResponse> create(@RequestBody @Valid TagRequest request);

    @DeleteMapping("/delete")
    Response<Boolean> delete(@RequestBody IdsRequest request);

    @GetMapping("/search")
    Response<List<TagResponse>> search(@RequestBody @Valid TagSearchRequest request);

}
