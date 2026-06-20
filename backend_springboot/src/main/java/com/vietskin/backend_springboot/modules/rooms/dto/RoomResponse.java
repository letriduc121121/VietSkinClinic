package com.vietskin.backend_springboot.modules.rooms.dto;

import java.time.LocalDateTime;

/** DTO trả về cho phòng khám — gồm bác sĩ phụ trách (rút gọn) thay vì entity Doctor. */
public record RoomResponse(
        Integer id,
        String name,
        Boolean active,
        LocalDateTime createdAt,
        Integer doctorId,
        Doctor doctor
) {
    public record Doctor(Integer id, User user) {}
    public record User(String name, String avatar) {}
}
