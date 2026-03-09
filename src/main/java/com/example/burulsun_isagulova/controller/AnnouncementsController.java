package com.example.burulsun_isagulova.controller;

import com.example.burulsun_isagulova.entity.Announcements;
import com.example.burulsun_isagulova.service.LalafoService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

/**
 * Контроллер — обрабатывает входящие HTTP-запросы.
 * Отдаёт HTML-страницу и JSON с объявлениями.
 */
@Controller
public class AnnouncementsController {

    private final LalafoService lalafoService;

    public AnnouncementsController(LalafoService lalafoService) {
        this.lalafoService = lalafoService;
    }

    @GetMapping("/test-result")
    public String announcements() {
        return "ann";
    }

    // Этот endpoint отдаёт JSON с объявлениями
    @GetMapping("/api/announcements")
    @ResponseBody
    public ResponseEntity<List<Announcements>> getAnnouncements() {
        try {
            List<Announcements> list = lalafoService.fetchAnnouncements();
            List<Announcements> top100 = list.stream().limit(100).toList();
            return ResponseEntity.ok(top100);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
