package com.example.dsproject.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "specialties") // MySQLの「specialties」テーブルと繋ぎます
public class Specialty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // IDは自動で増える設定です
    private Long id;

    private String prefecture;
    private String season;
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "local_dish", columnDefinition = "TEXT")
    private String localDish;// Javaでは「localDish」、MySQLでは「local_dish」に対応します

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;// Javaでは「imageUrl」、MySQLでは「image_url」に対応します

    // ---ここから下は、データを出し入れするための道具（Getter/Setter）です---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPrefecture() {
        return prefecture;
    }

    public void setPrefecture(String prefecture) {
        this.prefecture = prefecture;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocalDish() {
        return localDish;
    }

    public void setLocalDish(String localDish) {
        this.localDish = localDish;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

}
