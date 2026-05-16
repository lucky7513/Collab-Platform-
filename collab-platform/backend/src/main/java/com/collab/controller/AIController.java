package com.collab.controller;

import com.collab.dto.AIRequest;
import com.collab.dto.AIResponse;
import com.collab.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/process")
    public ResponseEntity<AIResponse> processText(@RequestBody AIRequest request) {
        String result = aiService.processText(request.action(), request.text());
        return ResponseEntity.ok(new AIResponse(result));
    }
}
