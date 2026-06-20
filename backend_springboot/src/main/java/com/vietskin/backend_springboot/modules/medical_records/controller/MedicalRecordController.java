package com.vietskin.backend_springboot.modules.medical_records.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.medical_records.dto.CreateMedicalRecordRequest;
import com.vietskin.backend_springboot.modules.medical_records.dto.MedicalRecordResponse;
import com.vietskin.backend_springboot.modules.medical_records.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    // Bác sĩ tạo bệnh án
    @PostMapping
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<MedicalRecordResponse> create(
            @Valid @RequestBody CreateMedicalRecordRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer doctorUserId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(medicalRecordService.create(req, doctorUserId));
    }

    // Bệnh nhân xem bệnh án của mình
    @GetMapping("/my")
    @PreAuthorize("hasRole('patient')")
    public ApiResponse<List<MedicalRecordResponse>> myRecords(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer patientId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(medicalRecordService.findByPatient(patientId));
    }

    // Bác sĩ / Admin / Lễ tân xem theo bệnh nhân
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('doctor','admin','receptionist')")
    public ApiResponse<List<MedicalRecordResponse>> byPatient(@PathVariable Integer patientId) {
        return ApiResponse.ok(medicalRecordService.findByPatient(patientId));
    }

    // Lấy bệnh án theo lịch hẹn (đọc lại sau khi khám / để sửa) — trả null nếu chưa có
    @GetMapping(params = "appointmentId")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<MedicalRecordResponse> byAppointment(@RequestParam Integer appointmentId) {
        return ApiResponse.ok(medicalRecordService.findByAppointment(appointmentId));
    }

    // Chi tiết 1 bệnh án — tất cả role đã đăng nhập
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<MedicalRecordResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(medicalRecordService.findOne(id));
    }

    // Bác sĩ cập nhật bệnh án
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<MedicalRecordResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody CreateMedicalRecordRequest req) {
        return ApiResponse.ok(medicalRecordService.update(id, req));
    }
}
