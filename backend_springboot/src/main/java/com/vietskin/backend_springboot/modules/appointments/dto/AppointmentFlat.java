package com.vietskin.backend_springboot.modules.appointments.dto;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.common.enums.Gender;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Kết quả PROJECTION phẳng từ JPQL (select new ...) — chỉ chứa cột vô hướng.
 * Vì không nạp entity User/Doctor nên Hibernate KHÔNG kích hoạt các quan hệ
 * @OneToOne inverse (User.patientProfile, User.doctor) → triệt tiêu N+1.
 * AppointmentMapper sẽ dựng AppointmentResponse lồng nhau từ record này.
 */
public record AppointmentFlat(
        Integer id,
        String patientName,
        String patientPhone,
        String patientEmail,
        String time,
        LocalDate date,
        AppointmentStatus status,
        String symptoms,
        Integer queueNumber,
        LocalDateTime createdAt,
        LocalDateTime confirmedAt,

        // patient (User)
        Integer patientId,
        String patientUserName,
        String patientUserPhone,

        // patient profile
        String patientCode,
        LocalDate dateOfBirth,
        Gender gender,
        String bloodType,
        String allergies,
        String medicalHistory,
        String province,
        String address,

        // doctor
        Integer doctorId,
        String doctorName,
        String doctorAvatar,
        BigDecimal consultationFee,

        // service
        Integer serviceId,
        String serviceName,
        BigDecimal servicePrice,

        // invoice
        Integer invoiceId,
        PaymentStatus invoiceStatus,
        BigDecimal invoiceAmount
) {}
