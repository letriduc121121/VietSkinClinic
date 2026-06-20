package com.vietskin.backend_springboot.modules.users.dto;

import java.time.LocalDateTime;

public record UserResponse(
        Integer id,
        String username,
        String name,
        String email,
        String phone,
        String avatar,
        Boolean active,
        LocalDateTime createdAt,
        RoleInfo role
) {}
