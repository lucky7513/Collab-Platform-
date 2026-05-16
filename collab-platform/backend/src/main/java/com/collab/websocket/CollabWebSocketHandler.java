package com.collab.websocket;

import com.collab.config.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class CollabWebSocketHandler extends TextWebSocketHandler {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    // documentId -> set of sessions
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    // sessionId -> {documentId, userEmail, userName, userColor}
    private final Map<String, SessionInfo> sessionInfo = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String documentId = extractDocumentId(session);
        String token = extractToken(session);

        if (token == null || !jwtUtil.validateToken(token)) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid token"));
            return;
        }

        String email = jwtUtil.extractEmail(token);
        String color = generateColor(email);

        // Add session to room
        rooms.computeIfAbsent(documentId, k -> ConcurrentHashMap.newKeySet()).add(session);
        sessionInfo.put(session.getId(), new SessionInfo(documentId, email, email.split("@")[0], color));

        log.info("User {} joined document {}", email, documentId);

        // Notify others that a new user joined
        broadcastToRoom(documentId, session, Map.of(
            "type", "user-joined",
            "sessionId", session.getId(),
            "userName", email.split("@")[0],
            "userColor", color,
            "userCount", rooms.get(documentId).size()
        ));

        // Send current room users to the new session
        sendToSession(session, Map.of(
            "type", "room-state",
            "sessionId", session.getId(),
            "userColor", color,
            "users", getRoomUsers(documentId)
        ));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        SessionInfo info = sessionInfo.get(session.getId());
        if (info == null) return;

        try {
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");

            switch (type) {
                case "doc-update" -> {
                    // Yjs document update — broadcast to all others in room
                    payload.put("sessionId", session.getId());
                    broadcastToRoom(info.documentId(), session, payload);
                }
                case "awareness" -> {
                    // Cursor position / presence — broadcast to all others
                    payload.put("sessionId", session.getId());
                    payload.put("userName", info.userName());
                    payload.put("userColor", info.userColor());
                    broadcastToRoom(info.documentId(), session, payload);
                }
                case "save-content" -> {
                    // Client sends plain text for DB persistence
                    log.debug("Content save request for document {}", info.documentId());
                    // DocumentService handles actual save via REST API
                }
                default -> log.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error handling message: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        SessionInfo info = sessionInfo.remove(session.getId());
        if (info == null) return;

        Set<WebSocketSession> room = rooms.get(info.documentId());
        if (room != null) {
            room.remove(session);
            if (room.isEmpty()) {
                rooms.remove(info.documentId());
            } else {
                // Notify others that user left
                broadcastToRoom(info.documentId(), null, Map.of(
                    "type", "user-left",
                    "sessionId", session.getId(),
                    "userCount", room.size()
                ));
            }
        }

        log.info("User {} left document {}", info.userEmail(), info.documentId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket error for session {}: {}", session.getId(), exception.getMessage());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private void broadcastToRoom(String documentId, WebSocketSession excludeSession, Map<String, Object> payload) {
        Set<WebSocketSession> room = rooms.get(documentId);
        if (room == null) return;

        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize payload", e);
            return;
        }

        for (WebSocketSession s : room) {
            if (s.isOpen() && !s.equals(excludeSession)) {
                try {
                    s.sendMessage(new TextMessage(json));
                } catch (IOException e) {
                    log.error("Failed to send to session {}", s.getId());
                }
            }
        }
    }

    private void sendToSession(WebSocketSession session, Map<String, Object> payload) {
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
        } catch (IOException e) {
            log.error("Failed to send message to session {}", session.getId());
        }
    }

    private List<Map<String, String>> getRoomUsers(String documentId) {
        Set<WebSocketSession> room = rooms.get(documentId);
        if (room == null) return List.of();

        return room.stream()
            .map(s -> {
                SessionInfo info = sessionInfo.get(s.getId());
                if (info == null) return null;
                return Map.of(
                    "sessionId", s.getId(),
                    "userName", info.userName(),
                    "userColor", info.userColor()
                );
            })
            .filter(Objects::nonNull)
            .toList();
    }

    private String extractDocumentId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private String extractToken(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] kv = param.split("=");
            if (kv.length == 2 && kv[0].equals("token")) return kv[1];
        }
        return null;
    }

    private String generateColor(String email) {
        String[] colors = {"#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#e91e63"};
        return colors[Math.abs(email.hashCode()) % colors.length];
    }

    record SessionInfo(String documentId, String userEmail, String userName, String userColor) {}
}
