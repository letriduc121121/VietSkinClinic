package com.vietskin.backend_springboot.modules.appointments.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO trả về cho client thay vì entity Appointment.
 * Chỉ chứa đúng các field frontend cần → Jackson không còn force-load quan hệ LAZY
 * (invoice, confirmedBy, patientProfile...) theo từng dòng nữa, hết N+1 khi serialize.
 *
 * Shape giữ giống JSON cũ (patient/doctor/service/invoice lồng nhau) nên frontend
 * gần như không phải đổi; bổ sung thêm `patientId` phẳng cho tiện truy cập.
 */
public record AppointmentResponse(
        Integer id,
        String patientName,
        String patientPhone,
        String patientEmail,
        String time,
        LocalDate date,
        String status,
        String symptoms,
        Integer queueNumber,
        Integer patientId,
        LocalDateTime createdAt,
        LocalDateTime confirmedAt,
        Patient patient,
        Doctor doctor,
        Service service,
        Invoice invoice
) {

    public record Patient(Integer id, String name, String phone, PatientProfile patientProfile) {}

    public record PatientProfile(
            String patientCode,
            LocalDate dateOfBirth,
            String gender,
            String bloodType,
            String allergies,
            String medicalHistory,
            String province,
            String address
    ) {}

    public record Doctor(Integer id, User user, BigDecimal consultationFee) {}

    public record User(String name, String avatar) {}

    public record Service(Integer id, String name, BigDecimal price) {}

    public record Invoice(Integer id, String status, BigDecimal amount) {}
}
