package com.vietskin.backend_springboot.modules.doctor_work_days.dto;

import java.time.LocalDate;

public record WorkDayResponse(
        Integer id,
        LocalDate date,
        Integer doctorId,
        String doctorName,
        Integer roomId,
        String roomName
) {}
