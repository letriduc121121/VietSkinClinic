package com.vietskin.backend_springboot.modules.appointments.mapper;

import com.vietskin.backend_springboot.modules.appointments.dto.AppointmentFlat;
import com.vietskin.backend_springboot.modules.appointments.dto.AppointmentResponse;

import java.util.List;

/**
 * Dựng AppointmentResponse (lồng nhau) từ projection phẳng AppointmentFlat.
 * Vì nguồn là projection nên không có entity LAZY nào bị động vào → không N+1.
 */
public final class AppointmentMapper {

    private AppointmentMapper() {}

    public static List<AppointmentResponse> toList(List<AppointmentFlat> rows) {
        return rows.stream().map(AppointmentMapper::toResponse).toList();
    }

    public static AppointmentResponse toResponse(AppointmentFlat f) {
        if (f == null) return null;
        return new AppointmentResponse(
                f.id(),
                f.patientName(),
                f.patientPhone(),
                f.patientEmail(),
                f.time(),
                f.date(),
                f.status() != null ? f.status().name() : null,
                f.symptoms(),
                f.queueNumber(),
                f.patientId(),
                f.createdAt(),
                f.confirmedAt(),
                toPatient(f),
                toDoctor(f),
                toService(f),
                toInvoice(f)
        );
    }

    private static AppointmentResponse.Patient toPatient(AppointmentFlat f) {
        if (f.patientId() == null) return null;
        return new AppointmentResponse.Patient(
                f.patientId(), f.patientUserName(), f.patientUserPhone(), toProfile(f));
    }

    private static AppointmentResponse.PatientProfile toProfile(AppointmentFlat f) {
        // Chỉ dựng khi có dữ liệu hồ sơ (tránh trả object rỗng cho bệnh nhân chưa có profile)
        if (f.patientCode() == null && f.dateOfBirth() == null && f.gender() == null) return null;
        return new AppointmentResponse.PatientProfile(
                f.patientCode(),
                f.dateOfBirth(),
                f.gender() != null ? f.gender().name() : null,
                f.bloodType(),
                f.allergies(),
                f.medicalHistory(),
                f.province(),
                f.address()
        );
    }

    private static AppointmentResponse.Doctor toDoctor(AppointmentFlat f) {
        if (f.doctorId() == null) return null;
        return new AppointmentResponse.Doctor(
                f.doctorId(),
                new AppointmentResponse.User(f.doctorName(), f.doctorAvatar()),
                f.consultationFee());
    }

    private static AppointmentResponse.Service toService(AppointmentFlat f) {
        if (f.serviceId() == null) return null;
        return new AppointmentResponse.Service(f.serviceId(), f.serviceName(), f.servicePrice());
    }

    private static AppointmentResponse.Invoice toInvoice(AppointmentFlat f) {
        if (f.invoiceId() == null) return null;
        return new AppointmentResponse.Invoice(
                f.invoiceId(), f.invoiceStatus() != null ? f.invoiceStatus().name() : null, f.invoiceAmount());
    }
}
