package com.collab.repository;

import com.collab.model.Document;
import com.collab.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByOwnerOrderByUpdatedAtDesc(User owner);

    Optional<Document> findByShareToken(String shareToken);

    // All docs where user is owner OR has a permission entry
    @Query("""
        SELECT DISTINCT d FROM Document d
        LEFT JOIN Permission p ON p.document = d
        WHERE d.owner = :user OR p.user = :user
        ORDER BY d.updatedAt DESC
    """)
    List<Document> findAllAccessibleByUser(User user);
}
