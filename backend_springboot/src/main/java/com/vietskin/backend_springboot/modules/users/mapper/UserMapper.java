package com.vietskin.backend_springboot.modules.users.mapper;

import com.vietskin.backend_springboot.modules.users.dto.PatientProfileInfo;
import com.vietskin.backend_springboot.modules.users.dto.ProfileResponse;
import com.vietskin.backend_springboot.modules.users.dto.RoleInfo;
import com.vietskin.backend_springboot.modules.users.dto.UserDetailResponse;
import com.vietskin.backend_springboot.modules.users.dto.UserResponse;
import com.vietskin.backend_springboot.modules.users.entity.PatientProfile;
import com.vietskin.backend_springboot.modules.users.entity.User;

public final class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(User u) {
        return new UserResponse(
                u.getId(), u.getUsername(), u.getName(), u.getEmail(), u.getPhone(),
                u.getAvatar(), u.getActive(), u.getCreatedAt(), roleInfo(u));
    }

    public static UserDetailResponse toDetail(User u) {
        return new UserDetailResponse(
                u.getId(), u.getUsername(), u.getName(), u.getEmail(), u.getPhone(),
                u.getAvatar(), u.getActive(), u.getCreatedAt(), u.getLastLoginAt(),
                roleInfo(u), profileInfo(u.getPatientProfile()));
    }

    public static ProfileResponse toProfile(User u) {
        return new ProfileResponse(
                u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getAvatar(),
                roleInfo(u), profileInfo(u.getPatientProfile()));
    }

    public static ProfileResponse toSummary(User u) {
        return new ProfileResponse(
                u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getAvatar(),
                roleInfo(u), null);
    }

    private static RoleInfo roleInfo(User u) {
        return u.getRole() != null ? new RoleInfo(u.getRole().getCode(), u.getRole().getName()) : null;
    }

    private static PatientProfileInfo profileInfo(PatientProfile p) {
        if (p == null) return null;
        return new PatientProfileInfo(
                p.getPatientCode(), p.getDateOfBirth(), p.getGender(), p.getAddress(),
                p.getProvince(), p.getDistrict(), p.getWard(), p.getCitizenId(),
                p.getEthnicity(), p.getBloodType(), p.getAllergies(),
                p.getMedicalHistory(), p.getEmergencyContact());
    }
}
