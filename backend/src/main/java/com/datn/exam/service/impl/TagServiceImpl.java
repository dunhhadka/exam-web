package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.TagRequest;
import com.datn.exam.model.dto.request.TagSearchRequest;
import com.datn.exam.model.dto.response.TagResponse;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.repository.TagRepository;
import com.datn.exam.service.TagService;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.SecurityUtils;
import com.datn.exam.support.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    @Override
    public TagResponse create(TagRequest request) {
        Tag tag = new Tag(
                request.getName(),
                SlugUtils.getSlug(request.getName()),
                request.getColorCode()
        );

        tagRepository.save(tag);

        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .colorCode(tag.getColorCode())
                .build();
    }

    @Override
    public void delete(IdsRequest request) {
        if (CollectionUtils.isEmpty(request.getIds())) {
            throw new ResponseException(BadRequestError.INVALID_IDS);
        }

        Tag tag = tagRepository.findById(request.getIds().get(0))
                .orElseThrow(() -> new ResponseException(NotFoundError.TAG_NOT_FOUND));

        tagRepository.delete(tag);
    }

    @Override
    public List<TagResponse> search(TagSearchRequest request) {

        String userId = SecurityUtils.getCurrentUser().orElse(null);
        List<Tag> tags;

        if (StringUtils.isBlank(request.getKeyword())) {
            tags = tagRepository.findByCreatedBy(userId);
        } else {
            tags = tagRepository.search(request.getKeyword());
        }

        return tags.stream().map(this::buildTagResponse).toList();
    }

    private TagResponse buildTagResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .colorCode(tag.getColorCode())
                .build();
    }
}
