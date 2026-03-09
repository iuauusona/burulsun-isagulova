package com.example.burulsun_isagulova.service;

import com.example.burulsun_isagulova.entity.Announcements;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
public class LalafoService {

    // Первая страница — без курсора
    private static final String API_FIRST =
            "https://lalafo.kg/api/search/v3/feed?expand=url&page=1&per-page=20&vip_count=5&m-name=last_push_up&sub-empty=0";

    // Следующие страницы — с курсором m-next-value
    private static final String API_NEXT =
            "https://lalafo.kg/api/search/v3/feed?expand=url&page=%d&per-page=20&vip_count=5&m-name=last_push_up&m-next-value=%s&sub-empty=0";

    public List<Announcements> fetchAnnouncements() throws IOException, InterruptedException {
        List<Announcements> result = new ArrayList<>();
        Gson gson = new Gson();
        HttpClient client = HttpClient.newHttpClient();

        String nextCursor = null;

        for (int page = 1; page <= 15; page++) {

            String url = (page == 1)
                    ? API_FIRST
                    : String.format(API_NEXT, page, nextCursor);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .header("accept",         "application/json, text/plain, */*")
                    .header("country-id",     "12")
                    .header("device",         "pc")
                    .header("language",       "ru_RU")
                    .header("user-agent",     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                            "AppleWebKit/537.36 (KHTML, like Gecko) " +
                            "Chrome/145.0.0.0 Safari/537.36")
                    .header("referer",        "https://lalafo.kg/")
                    .header("x-cache-bypass", "yes")
                    .build();

            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            JsonObject root = gson.fromJson(response.body(), JsonObject.class);


            if (!root.has("items") || root.get("items").isJsonNull()) {
                System.err.println("Страница " + page + ": items отсутствует");
                break;
            }

            JsonArray items = root.getAsJsonArray("items");
            if (items.size() == 0) {
                System.out.println("Страница " + page + ": items пустой, стоп");
                break;
            }

            JsonObject lastItem = items.get(items.size() - 1).getAsJsonObject();
            if (lastItem.has("last_push_up") && !lastItem.get("last_push_up").isJsonNull()) {
                nextCursor = lastItem.get("last_push_up").getAsString();
            }

            for (JsonElement el : items) {
                JsonObject item = el.getAsJsonObject();
                try {
                    Announcements p = new Announcements();

                    p.setId(item.get("id").getAsLong());
                    p.setTitle(item.get("title").getAsString());

                    // Цена
                    if (item.has("price") && !item.get("price").isJsonNull()) {
                        p.setPrice(item.get("price").getAsBigDecimal());
                    } else {
                        p.setPrice(BigDecimal.ZERO);
                    }

                    // Город — строка
                    if (item.has("city") && !item.get("city").isJsonNull()) {
                        p.setCity(item.get("city").getAsString());
                    }

                    // Фото — первый элемент массива images → thumbnail_url
                    if (item.has("images") && item.get("images").isJsonArray()) {
                        JsonArray images = item.getAsJsonArray("images");
                        if (images.size() > 0) {
                            JsonObject img = images.get(0).getAsJsonObject();
                            if (img.has("thumbnail_url")) {
                                p.setImageUrl(img.get("thumbnail_url").getAsString());
                            }
                        }
                    }

                    // Дата — Unix timestamp в секундах, UTC+6
                    if (item.has("created_time") && !item.get("created_time").isJsonNull()) {
                        long ts = item.get("created_time").getAsLong();
                        p.setPublishedAt(
                                LocalDateTime.ofEpochSecond(ts, 0, ZoneOffset.ofHours(6))
                        );
                    }

                    // Ссылка на объявление
                    if (item.has("url") && !item.get("url").isJsonNull()) {
                        p.setUrl("https://lalafo.kg" + item.get("url").getAsString());
                    }

                    // Фильтр — только объявления не старше 3 месяцев
                    LocalDateTime threeMonthsAgo = LocalDateTime.now().minusMonths(3);
                    if (p.getPublishedAt() == null || p.getPublishedAt().isAfter(threeMonthsAgo)) {
                        result.add(p);
                    }

                } catch (Exception e) {
                    System.err.println("Пропускаю объявление: " + e.getMessage());
                }
            }

            System.out.println("Страница " + page + " загружена, курсор: " + nextCursor);
        }

        return result;
    }
}
