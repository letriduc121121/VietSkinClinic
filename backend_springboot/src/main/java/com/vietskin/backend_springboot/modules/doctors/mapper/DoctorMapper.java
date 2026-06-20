package com.vietskin.backend_springboot.modules.doctors.mapper;

import com.vietskin.backend_springboot.modules.doctors.dto.DoctorResponse;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;

public final class DoctorMapper {

    private DoctorMapper() {}

    public static DoctorResponse toResponse(Doctor d) {
        DoctorResponse.UserInfo user = null;
        if (d.getUser() != null) {
            user = new DoctorResponse.UserInfo(
                    d.getUser().getId(),
                    d.getUser().getName(),
                    d.getUser().getEmail() != null ? d.getUser().getEmail() : "",
                    d.getUser().getPhone(),
                    d.getUser().getAvatar() != null ? d.getUser().getAvatar() : ""
            );
        }
        return new DoctorResponse(
                d.getId(),
                d.getSpecialty(),
                d.getExperience(),
                d.getDegree(),
                d.getDescription(),
                d.getConsultationFee(),
                d.getActive(),
                d.getKeywords(),
                user
        );
    }
}
