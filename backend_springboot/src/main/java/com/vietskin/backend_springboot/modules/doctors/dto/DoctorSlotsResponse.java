package com.vietskin.backend_springboot.modules.doctors.dto;

import java.util.List;

public record DoctorSlotsResponse(String date, WorkDayInfo workDay, List<Slot> slots) {

    public record WorkDayInfo(String room) {}

    public record Slot(String time, boolean available) {}
}
