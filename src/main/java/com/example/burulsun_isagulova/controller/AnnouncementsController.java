package com.example.burulsun_isagulova.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AnnouncementsController {

    @GetMapping("/test-result")
    public String announcements() {
        return "ann";
    }
}
