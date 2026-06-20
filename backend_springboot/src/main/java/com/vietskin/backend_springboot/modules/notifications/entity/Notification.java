package com.vietskin.backend_springboot.modules.notifications.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vietskin.backend_springboot.modules.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications",
    indexes = {
        @Index(name = "idx_notifications_user", columnList = "user_id"),
        @Index(name = "idx_notifications_is_read", columnList = "is_read")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Role được nhắm tới (VD: Gửi thông báo cho toàn bộ Lễ Tân = Role ID 2)
    @Column(name = "target_role_id")
    private Integer targetRoleId;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Nếu thông báo gửi đích danh cho 1 user. FE không đọc object user → ẩn khỏi JSON
    // (tránh serialize quan hệ LAZY khi đã tắt FORCE_LAZY_LOADING).
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
