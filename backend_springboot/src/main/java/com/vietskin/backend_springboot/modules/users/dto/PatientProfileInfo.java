package com.vietskin.backend_springboot.modules.users.dto;

import com.vietskin.backend_springboot.common.enums.Gender;

import java.time.LocalDate;

public record PatientProfileInfo(
        String patientCode,
        LocalDate dateOfBirth,
        Gender gender,
        String address,
        String province,
        String district,
        String ward,
        String citizenId,
        String ethnicity,
        String bloodType,
        String allergies,
        String medicalHistory,
        String emergencyContact
) {}
