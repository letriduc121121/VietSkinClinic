package com.vietskin.backend_springboot.modules.users.dto;

import java.time.LocalDateTime;

public record UserDetailResponse(
        Integer id,
        String username,
        String name,
        String email,
        String phone,
        String avatar,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt,
        RoleInfo role,
        PatientProfileInfo patientProfile
) {}
