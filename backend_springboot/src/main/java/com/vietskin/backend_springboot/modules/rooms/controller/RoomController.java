package com.vietskin.backend_springboot.modules.rooms.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.rooms.dto.CreateRoomRequest;
import com.vietskin.backend_springboot.modules.rooms.dto.RoomResponse;
import com.vietskin.backend_springboot.modules.rooms.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    // Tất cả staff xem được
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<RoomResponse>> findAll() {
        return ApiResponse.ok(roomService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<RoomResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(roomService.findOne(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<RoomResponse> create(@Valid @RequestBody CreateRoomRequest req) {
        return ApiResponse.ok(roomService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<RoomResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody CreateRoomRequest req) {
        return ApiResponse.ok(roomService.update(id, req));
    }

    // Bật / tắt phòng — endpoint riêng nên không vướng validation @NotBlank của name
    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<RoomResponse> toggleActive(@PathVariable Integer id) {
        return ApiResponse.ok(roomService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<RoomResponse> remove(@PathVariable Integer id) {
        return ApiResponse.ok(roomService.remove(id));
    }
}
