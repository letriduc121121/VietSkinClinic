package com.vietskin.backend_springboot.modules.users.controller;

import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.users.dto.*;
import com.vietskin.backend_springboot.modules.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<List<UserResponse>> findAll() {
        return ApiResponse.ok(userService.findAll());
    }

    @GetMapping("/profile")
    public ApiResponse<ProfileResponse> getProfile(@CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(userService.getProfile(userId));
    }

    @PutMapping("/profile")
    public ApiResponse<ProfileResponse> updateProfile(
            @CurrentUser UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest req) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(userService.updateProfile(userId, req));
    }

    @PutMapping("/change-password")
    public ApiResponse<MessageResponse> changePassword(
            @CurrentUser UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest req) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(userService.changePassword(userId, req));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<ProfileResponse> findByPhone(@RequestParam String phone) {
        return ApiResponse.ok(userService.findByPhone(phone));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<UserDetailResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(userService.findOne(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<ProfileResponse> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.ok(userService.updateProfile(id, req));
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<StatusResponse> toggleActive(@PathVariable Integer id) {
        return ApiResponse.ok(userService.toggleActive(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<ProfileResponse> createUser(@Valid @RequestBody CreateUserRequest req) {
        return ApiResponse.ok(userService.createUser(req));
    }

    @PostMapping("/staff")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<ProfileResponse> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        return ApiResponse.ok(userService.createStaff(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<StatusResponse> deleteUser(@PathVariable Integer id) {
        return ApiResponse.ok(userService.deleteUser(id));
    }
}
