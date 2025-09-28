package com.datn.exam.model.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Table(name = "tags")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class Tag extends AuditableEntity{

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private long id;

    private String name;

    private String slug;

    @Column(name = "color_code")
    private String colorCode;

    @ManyToMany(mappedBy = "tags", fetch = FetchType.LAZY)
    private List<Exam> exams;


    public Tag(String name, String slug, String colorCode) {
        this.name = name;
        this.slug = slug;
        this.colorCode = colorCode;
    }
}
