package com.vietskin.backend_springboot.modules.invoices.dto;

import com.vietskin.backend_springboot.common.enums.PaymentMethod;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Kết quả PROJECTION phẳng từ JPQL (select new ...) — chỉ chứa cột vô hướng.
 * Vì không nạp entity User nên Hibernate KHÔNG kích hoạt các quan hệ LAZY
 * (patient/receivedBy.patientProfile...) → triệt tiêu N+1.
 * InvoiceMapper sẽ dựng InvoiceResponse lồng nhau từ record này.
 */
public record InvoiceFlat(
        Integer id,
        String invoiceCode,
        String patientName,
        String description,
        BigDecimal amount,
        PaymentStatus status,
        PaymentMethod method,
        LocalDateTime paidAt,
        String note,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // patient (User)
        Integer patientId,
        String patientUserName,
        String patientUserPhone,

        // receivedBy (User)
        Integer receivedById,
        String receivedByName
) {}
