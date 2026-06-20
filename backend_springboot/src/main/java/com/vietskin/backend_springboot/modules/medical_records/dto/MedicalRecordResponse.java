package com.vietskin.backend_springboot.modules.medical_records.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về cho client thay vì entity MedicalRecord.
 * Mirror đúng shape JSON mà frontend đang đọc (xem medical-record.types.ts) nên FE
 * không phải sửa. Vì map trong @Transactional(readOnly=true), Jackson không còn
 * force-load quan hệ LAZY khi serialize → có thể tắt FORCE_LAZY_LOADING sau này.
 */
public record MedicalRecordResponse(
        Integer id,
        String symptoms,
        String skinType,
        String lesionLocation,
        String diagnosis,
        String treatment,
        String note,
        LocalDate followUpDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Appointment appointment,
        Doctor doctor,
        List<Prescription> prescriptions,
        List<Image> images
) {

    // appointment lồng: chỉ các field FE dùng (id để map với danh sách lịch hẹn, date, time, patientName, service.name)
    public record Appointment(Integer id, LocalDate date, String time, String patientName, Service service) {}

    public record Service(String name) {}

    // doctor lồng: FE đọc doctor.user.name (+ avatar)
    public record Doctor(User user) {}

    public record User(String name, String avatar) {}

    // đơn thuốc + chi tiết thuốc
    public record Prescription(Integer id, String note, LocalDateTime createdAt, List<Item> items) {}

    public record Item(
            Integer id,
            String medicineName,
            String dosage,
            String frequency,
            String duration,
            Integer quantity,
            String note
    ) {}

    // ảnh tổn thương da
    public record Image(
            Integer id,
            Integer medicalRecordId,
            String imageUrl,
            String publicId,
            String note,
            LocalDateTime createdAt
    ) {}
}
