package com.collab.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    @Value("${ai.anthropic.api-key}")
    private String apiKey;

    @Value("${ai.anthropic.model}")
    private String model;

    @Value("${ai.anthropic.url}")
    private String apiUrl;

    private final WebClient webClient = WebClient.builder().build();

    public String processText(String action, String text) {
        String prompt = buildPrompt(action, text);

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", 1024,
            "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        try {
            Map response = webClient.post()
                .uri(apiUrl)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (response != null && response.containsKey("content")) {
                List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
                if (!content.isEmpty()) {
                    return (String) content.get(0).get("text");
                }
            }
        } catch (Exception e) {
            log.error("AI API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable");
        }

        throw new RuntimeException("Empty response from AI");
    }

    private String buildPrompt(String action, String text) {
        return switch (action) {
            case "summarize" -> "Summarize the following text concisely in 2-3 sentences:\n\n" + text;
            case "rephrase"  -> "Rephrase the following text to be clearer and more professional. Return only the rephrased text:\n\n" + text;
            case "continue"  -> "Continue writing the following text naturally for 1-2 more paragraphs. Return only the continuation:\n\n" + text;
            case "grammar"   -> "Fix any grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n" + text;
            case "shorten"   -> "Shorten the following text while keeping the key points. Return only the shortened version:\n\n" + text;
            case "bullets"   -> "Convert the following text into a clear bullet-point list. Return only the bullet points:\n\n" + text;
            default          -> throw new IllegalArgumentException("Unknown action: " + action);
        };
    }
}
