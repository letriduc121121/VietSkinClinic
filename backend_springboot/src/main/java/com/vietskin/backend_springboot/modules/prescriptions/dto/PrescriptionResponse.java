package com.vietskin.backend_springboot.modules.prescriptions.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về cho client thay vì entity Prescription.
 * Chỉ chứa đúng các field frontend cần (id, note, createdAt, items[]) → Jackson
 * không còn force-load quan hệ LAZY (appointment, medicine, medicalRecord) khi
 * serialize nữa → an toàn khi tắt FORCE_LAZY_LOADING.
 *
 * Shape giữ giống JSON cũ: { id, note, createdAt, items:[{...}] }. FE không phải sửa.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PrescriptionResponse(
        Integer id,
        String note,
        LocalDateTime createdAt,
        List<ItemResponse> items
) {

    /**
     * Chi tiết 1 dòng thuốc. `medicine` lồng nhau là tùy chọn (FE hiện chỉ đọc
     * medicineName), giữ lại để khớp JSON cũ và phòng FE dùng sau.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ItemResponse(
            Integer id,
            String medicineName,
            String dosage,
            String frequency,
            String duration,
            Integer quantity,
            String note,
            Medicine medicine
    ) {}

    public record Medicine(Integer id, String name) {}
}
