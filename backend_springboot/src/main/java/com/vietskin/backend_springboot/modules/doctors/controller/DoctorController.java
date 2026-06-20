package com.vietskin.backend_springboot.modules.doctors.controller;

import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.doctors.dto.DoctorResponse;
import com.vietskin.backend_springboot.modules.doctors.dto.DoctorSlotsResponse;
import com.vietskin.backend_springboot.modules.doctors.dto.UpdateDoctorRequest;
import com.vietskin.backend_springboot.modules.doctors.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ApiResponse<List<DoctorResponse>> findAll() {
        return ApiResponse.ok(doctorService.findAll());
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<List<DoctorResponse>> findAllForAdmin() {
        return ApiResponse.ok(doctorService.findAllForAdmin());
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<DoctorResponse> toggleActive(@PathVariable Integer id) {
        return ApiResponse.ok(doctorService.toggleActive(id));
    }

    @GetMapping("/{id}/slots")
    public ApiResponse<DoctorSlotsResponse> getSlots(
            @PathVariable Integer id,
            @RequestParam String date) {
        return ApiResponse.ok(doctorService.getAvailableSlots(id, date));
    }

    @GetMapping("/{id}")
    public ApiResponse<DoctorResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(doctorService.findOne(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('doctor', 'admin')")
    public ApiResponse<DoctorResponse> update(
            @PathVariable Integer id,
            @RequestBody UpdateDoctorRequest req) {
        return ApiResponse.ok(doctorService.update(id, req));
    }

    @GetMapping("/me/profile")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<DoctorResponse> getMyProfile(
            @CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(doctorService.findByUserId(userId));
    }
}
