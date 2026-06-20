package com.vietskin.backend_springboot.modules.rooms.mapper;

import com.vietskin.backend_springboot.modules.rooms.dto.RoomFlat;
import com.vietskin.backend_springboot.modules.rooms.dto.RoomResponse;

import java.util.List;

/** Dựng RoomResponse (lồng) từ projection phẳng RoomFlat. */
public final class RoomMapper {

    private RoomMapper() {}

    public static List<RoomResponse> toList(List<RoomFlat> rows) {
        return rows.stream().map(RoomMapper::toResponse).toList();
    }

    public static RoomResponse toResponse(RoomFlat f) {
        if (f == null) return null;
        RoomResponse.Doctor doctor = f.doctorId() == null ? null
                : new RoomResponse.Doctor(
                        f.doctorId(),
                        new RoomResponse.User(f.doctorUserName(), f.doctorUserAvatar()));
        return new RoomResponse(f.id(), f.name(), f.active(), f.createdAt(), f.doctorId(), doctor);
    }
}
