package com.vietskin.backend_springboot.modules.doctor_work_days.mapper;

import com.vietskin.backend_springboot.modules.doctor_work_days.dto.WorkDayResponse;
import com.vietskin.backend_springboot.modules.doctor_work_days.entity.DoctorWorkDay;

public final class WorkDayMapper {

    private WorkDayMapper() {}

    public static WorkDayResponse toResponse(DoctorWorkDay w) {
        String doctorName = w.getDoctor().getUser() != null ? w.getDoctor().getUser().getName() : "";
        return new WorkDayResponse(
                w.getId(),
                w.getDate(),
                w.getDoctor().getId(),
                doctorName,
                w.getRoom().getId(),
                w.getRoom().getName()
        );
    }
}
