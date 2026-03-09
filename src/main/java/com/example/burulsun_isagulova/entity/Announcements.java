package com.example.burulsun_isagulova.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Модель одного объявления с лалафо.кг.
 * Содержит только те поля, которые отображаются на фронтенде.
 */
public class Announcements {
    private long id;
    private String title;
    private String imageUrl;
    private String city;
    private BigDecimal price;
    private LocalDateTime publishedAt;
    private String url;

    public long getId() {
        return id;
    }
    public String getUrl() {
        return url;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public void setUrl(String url) {
    }
}
