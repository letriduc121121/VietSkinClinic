package com.vietskin.backend_springboot.modules.invoices.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về cho client thay vì entity Invoice.
 * Chỉ chứa đúng các field frontend cần → Jackson không còn force-load quan hệ LAZY
 * (patient, receivedBy) theo từng dòng nữa, hết N+1 khi serialize.
 *
 * Shape giữ giống JSON cũ (scalar + patient/receivedBy lồng nhau) nên frontend
 * không phải đổi; quan hệ `appointment` vẫn bị bỏ qua như trước (entity @JsonIgnore).
 */
public record InvoiceResponse(
        Integer id,
        String invoiceCode,
        String patientName,
        String description,
        BigDecimal amount,
        String status,
        String method,
        LocalDateTime paidAt,
        String note,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Patient patient,
        ReceivedBy receivedBy
) {

    public record Patient(Integer id, String name, String phone) {}

    public record ReceivedBy(Integer id, String name) {}
}
