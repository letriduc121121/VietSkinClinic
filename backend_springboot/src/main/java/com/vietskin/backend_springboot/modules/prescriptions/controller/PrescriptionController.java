package com.vietskin.backend_springboot.modules.prescriptions.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.prescriptions.dto.CreatePrescriptionRequest;
import com.vietskin.backend_springboot.modules.prescriptions.dto.PrescriptionResponse;
import com.vietskin.backend_springboot.modules.prescriptions.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    // Bác sĩ tạo đơn thuốc
    @PostMapping
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<PrescriptionResponse> create(
            @Valid @RequestBody CreatePrescriptionRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer doctorUserId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(prescriptionService.create(req, doctorUserId));
    }

    // Chi tiết đơn thuốc
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PrescriptionResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(prescriptionService.findOne(id));
    }

    // Theo lịch hẹn
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('doctor','admin','receptionist')")
    public ApiResponse<List<PrescriptionResponse>> byAppointment(@PathVariable Integer appointmentId) {
        return ApiResponse.ok(prescriptionService.findByAppointment(appointmentId));
    }

    // Theo bệnh án
    @GetMapping("/medical-record/{medicalRecordId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<PrescriptionResponse>> byMedicalRecord(@PathVariable Integer medicalRecordId) {
        return ApiResponse.ok(prescriptionService.findByMedicalRecord(medicalRecordId));
    }

    // Bệnh nhân xem đơn thuốc của mình
    @GetMapping("/my/list")
    @PreAuthorize("hasRole('patient')")
    public ApiResponse<List<PrescriptionResponse>> myPrescriptions(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer patientId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(prescriptionService.findByPatient(patientId));
    }

    // Xóa đơn thuốc
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        prescriptionService.delete(id);
        return ApiResponse.ok(null);
    }
}
