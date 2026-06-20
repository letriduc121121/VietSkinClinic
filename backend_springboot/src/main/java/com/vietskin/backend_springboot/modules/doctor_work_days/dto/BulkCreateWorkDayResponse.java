package com.vietskin.backend_springboot.modules.doctor_work_days.dto;

import java.time.LocalDate;
import java.util.List;

public record BulkCreateWorkDayResponse(List<Created> success, List<Failed> failed) {

    public record Created(LocalDate date, Integer roomId) {}

    public record Failed(LocalDate date, String reason) {}
}
