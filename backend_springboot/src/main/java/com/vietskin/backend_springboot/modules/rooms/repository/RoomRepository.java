package com.vietskin.backend_springboot.modules.rooms.repository;

import com.vietskin.backend_springboot.modules.rooms.dto.RoomFlat;
import com.vietskin.backend_springboot.modules.rooms.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Integer> {
    Optional<Room> findByDoctorId(Integer doctorId);
    List<Room> findByActiveTrue();

    // Projection phẳng: select scalar + LEFT JOIN bác sĩ phụ trách (không nạp entity Doctor/User)
    String PROJECTION = "SELECT new com.vietskin.backend_springboot.modules.rooms.dto.RoomFlat(" +
            "r.id, r.name, r.active, r.createdAt, d.id, du.name, du.avatar) " +
            "FROM Room r LEFT JOIN r.doctor d LEFT JOIN d.user du ";

    @Query(PROJECTION + "ORDER BY LOWER(r.name)")
    List<RoomFlat> findAllFlat();

    @Query(PROJECTION + "WHERE r.id = :id")
    Optional<RoomFlat> findFlatById(@Param("id") Integer id);
}
