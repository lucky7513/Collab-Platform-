package com.collab.service;

import com.collab.dto.DocumentDto;
import com.collab.model.Document;
import com.collab.model.Permission;
import com.collab.model.User;
import com.collab.repository.DocumentRepository;
import com.collab.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PermissionRepository permissionRepository;
    private final UserService userService;

    public List<DocumentDto> getAllDocuments(String email) {
        User user = userService.getCurrentUser(email);
        return documentRepository.findAllAccessibleByUser(user)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public DocumentDto createDocument(String email) {
        User user = userService.getCurrentUser(email);

        Document doc = Document.builder()
                .title("Untitled Document")
                .owner(user)
                .shareToken(UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .build();

        doc = documentRepository.save(doc);

        // Owner also gets an explicit permission entry
        Permission perm = Permission.builder()
                .document(doc)
                .user(user)
                .role(Permission.Role.OWNER)
                .build();
        permissionRepository.save(perm);

        return toDto(doc);
    }

    public DocumentDto getDocument(UUID id, String email) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        User user = userService.getCurrentUser(email);
        assertCanRead(doc, user);

        return toDto(doc);
    }

    @Transactional
    public DocumentDto updateTitle(UUID id, String title, String email) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        User user = userService.getCurrentUser(email);
        assertCanEdit(doc, user);

        doc.setTitle(title);
        return toDto(documentRepository.save(doc));
    }

    @Transactional
    public DocumentDto saveContent(UUID id, String content, String email) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        User user = userService.getCurrentUser(email);
        assertCanEdit(doc, user);

        doc.setContent(content);
        return toDto(documentRepository.save(doc));
    }

    @Transactional
    public void deleteDocument(UUID id, String email) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        User user = userService.getCurrentUser(email);
        if (!doc.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only the owner can delete a document");
        }

        permissionRepository.deleteAll(permissionRepository.findByDocument(doc));
        documentRepository.delete(doc);
    }

    public DocumentDto getByShareToken(String token) {
        Document doc = documentRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return toDto(doc);
    }

    @Transactional
    public void shareWithUser(UUID docId, String targetEmail, String role, String ownerEmail) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        User owner = userService.getCurrentUser(ownerEmail);
        assertIsOwner(doc, owner);

        User target = userService.getCurrentUser(targetEmail);
        Permission.Role permRole = Permission.Role.valueOf(role.toUpperCase());

        Permission existing = permissionRepository.findByDocumentAndUser(doc, target).orElse(null);
        if (existing != null) {
            existing.setRole(permRole);
            permissionRepository.save(existing);
        } else {
            permissionRepository.save(Permission.builder()
                    .document(doc).user(target).role(permRole).build());
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private void assertCanRead(Document doc, User user) {
        if (doc.getIsPublic()) return;
        if (doc.getOwner().getId().equals(user.getId())) return;
        if (permissionRepository.existsByDocumentAndUser(doc, user)) return;
        throw new RuntimeException("Access denied");
    }

    private void assertCanEdit(Document doc, User user) {
        if (doc.getOwner().getId().equals(user.getId())) return;
        permissionRepository.findByDocumentAndUser(doc, user).ifPresentOrElse(
            p -> { if (p.getRole() == Permission.Role.VIEWER) throw new RuntimeException("Read-only access"); },
            () -> { throw new RuntimeException("Access denied"); }
        );
    }

    private void assertIsOwner(Document doc, User user) {
        if (!doc.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only the owner can manage permissions");
        }
    }

    private DocumentDto toDto(Document doc) {
        return new DocumentDto(
            doc.getId(),
            doc.getTitle(),
            doc.getOwner().getName(),
            doc.getOwner().getEmail(),
            doc.getShareToken(),
            doc.getIsPublic(),
            doc.getContent(),
            doc.getCreatedAt(),
            doc.getUpdatedAt()
        );
    }
}
