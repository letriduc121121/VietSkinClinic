package com.vietskin.backend_springboot.modules.users.dto;

public record ProfileResponse(
        Integer id,
        String name,
        String email,
        String phone,
        String avatar,
        RoleInfo role,
        PatientProfileInfo patientProfile
) {}
