package com.vietskin.backend_springboot.modules.appointments.controller;

import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.appointments.dto.AppointmentResponse;
import com.vietskin.backend_springboot.modules.appointments.dto.CreateAppointmentRequest;
import com.vietskin.backend_springboot.modules.appointments.dto.UpdateStatusRequest;
import com.vietskin.backend_springboot.modules.appointments.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // ── Đặt lịch (public hoặc đã login) ─────────────────────
    @PostMapping
    public ApiResponse<AppointmentResponse> create(
            @Valid @RequestBody CreateAppointmentRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = userDetails != null
                ? Integer.valueOf(userDetails.getUsername()) : null;
        return ApiResponse.ok(appointmentService.create(req, userId));
    }

    // ── Slot đã đặt (public) ─────────────────────────────────
    @GetMapping("/booked-slots")
    public ApiResponse<List<String>> getBookedSlots(
            @RequestParam Integer doctorId,
            @RequestParam String date) {
        return ApiResponse.ok(appointmentService.getBookedSlots(doctorId, date));
    }

    // ── Lễ tân/Admin/Bác sĩ xem tất cả ─────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'receptionist', 'doctor')")
    public ApiResponse<List<AppointmentResponse>> findAll(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) Integer doctorId,
            @RequestParam(required = false) String status) {
        return ApiResponse.ok(appointmentService.findAll(date, dateFrom, dateTo, doctorId, status));
    }

    // ── Bệnh nhân xem lịch của mình ─────────────────────────
    @GetMapping("/my")
    public ApiResponse<List<AppointmentResponse>> findMy(
            @CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(appointmentService.findByPatient(userId));
    }

    // ── Lễ tân tra cứu SĐT ──────────────────────────────────
    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<Map<String, Object>> lookup(
            @RequestParam String phone,
            @RequestParam(required = false) String date) {
        return ApiResponse.ok(appointmentService.lookupByPhone(phone, date));
    }

    // ── Hàng chờ (checked_in + in_progress) ─────────────────
    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('admin', 'receptionist', 'doctor')")
    public ApiResponse<List<AppointmentResponse>> getQueue(
            @RequestParam Integer doctorId,
            @RequestParam(required = false) String date) {
        return ApiResponse.ok(appointmentService.findQueue(doctorId, date));
    }

    // ── Lịch ngày (tổng quan) ────────────────────────────────
    @GetMapping("/schedule")
    @PreAuthorize("hasAnyRole('admin', 'receptionist', 'doctor')")
    public ApiResponse<List<AppointmentResponse>> getDaySchedule(
            @RequestParam Integer doctorId,
            @RequestParam(required = false) String date) {
        return ApiResponse.ok(appointmentService.findDaySchedule(doctorId, date));
    }

    // ── Admin xem lịch sử 1 bệnh nhân ───────────────────────
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<List<AppointmentResponse>> findByPatient(
            @PathVariable Integer patientId) {
        return ApiResponse.ok(appointmentService.findByPatient(patientId));
    }

    // ── Chi tiết 1 lịch hẹn ─────────────────────────────────
    @GetMapping("/{id}")
    public ApiResponse<AppointmentResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(appointmentService.getById(id));
    }

    // ── Cập nhật trạng thái ──────────────────────────────────
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('admin', 'receptionist', 'doctor')")
    public ApiResponse<AppointmentResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateStatusRequest req,
            @CurrentUser UserDetails userDetails) {
        Integer currentUserId = userDetails != null
                ? Integer.valueOf(userDetails.getUsername()) : null;
        return ApiResponse.ok(appointmentService.updateStatus(id, req, currentUserId));
    }

    // ── Hủy lịch ────────────────────────────────────────────
    @PutMapping("/{id}/cancel")
    public ApiResponse<AppointmentResponse> cancel(@PathVariable Integer id) {
        return ApiResponse.ok(appointmentService.cancel(id));
    }
}
