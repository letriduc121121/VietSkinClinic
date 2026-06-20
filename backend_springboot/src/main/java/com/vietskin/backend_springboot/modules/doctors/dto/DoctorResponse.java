package com.vietskin.backend_springboot.modules.doctors.dto;

import java.math.BigDecimal;

public record DoctorResponse(
        Integer id,
        String specialty,
        String experience,
        String degree,
        String description,
        BigDecimal consultationFee,
        Boolean active,
        String keywords,
        UserInfo user
) {

    public record UserInfo(Integer id, String name, String email, String phone, String avatar) {}
}
