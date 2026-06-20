package com.vietskin.backend_springboot.modules.rooms.dto;

import java.time.LocalDateTime;

/** Projection phẳng cho Room (không nạp entity Doctor/User → tránh N+1). */
public record RoomFlat(
        Integer id,
        String name,
        Boolean active,
        LocalDateTime createdAt,
        Integer doctorId,
        String doctorUserName,
        String doctorUserAvatar
) {}
