package com.collab.dto;

import java.time.LocalDateTime;
import java.util.UUID;

// Auth DTOs
public record RegisterRequest(String name, String email, String password) {}
public record AuthRequest(String email, String password) {}
public record AuthResponse(String token, String name, String email, String avatarColor) {}

// Document DTOs
public record DocumentDto(
    UUID id,
    String title,
    String ownerName,
    String ownerEmail,
    String shareToken,
    Boolean isPublic,
    String content,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

public record UpdateTitleRequest(String title) {}
public record SaveContentRequest(String content) {}
public record ShareRequest(String email, String role) {}

// AI DTOs
public record AIRequest(String action, String text) {}
public record AIResponse(String result) {}
