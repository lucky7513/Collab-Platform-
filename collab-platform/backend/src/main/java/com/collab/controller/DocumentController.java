package com.collab.controller;

import com.collab.dto.*;
import com.collab.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<DocumentDto>> getAllDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.getAllDocuments(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<DocumentDto> createDocument(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.createDocument(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDto> getDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.getDocument(id, userDetails.getUsername()));
    }

    @PatchMapping("/{id}/title")
    public ResponseEntity<DocumentDto> updateTitle(
            @PathVariable UUID id,
            @RequestBody UpdateTitleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.updateTitle(id, request.title(), userDetails.getUsername()));
    }

    @PatchMapping("/{id}/content")
    public ResponseEntity<DocumentDto> saveContent(
            @PathVariable UUID id,
            @RequestBody SaveContentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(documentService.saveContent(id, request.content(), userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.deleteDocument(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/shared/{token}")
    public ResponseEntity<DocumentDto> getByShareToken(@PathVariable String token) {
        return ResponseEntity.ok(documentService.getByShareToken(token));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Void> shareDocument(
            @PathVariable UUID id,
            @RequestBody ShareRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.shareWithUser(id, request.email(), request.role(), userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
