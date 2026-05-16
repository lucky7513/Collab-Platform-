package com.collab.repository;

import com.collab.model.Document;
import com.collab.model.Permission;
import com.collab.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByDocumentAndUser(Document document, User user);
    List<Permission> findByDocument(Document document);
    boolean existsByDocumentAndUser(Document document, User user);
}
