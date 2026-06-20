package com.vietskin.backend_springboot.modules.rooms.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.rooms.dto.CreateRoomRequest;
import com.vietskin.backend_springboot.modules.rooms.dto.RoomResponse;
import com.vietskin.backend_springboot.modules.rooms.entity.Room;
import com.vietskin.backend_springboot.modules.rooms.mapper.RoomMapper;
import com.vietskin.backend_springboot.modules.rooms.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final DoctorRepository doctorRepository;

    public List<RoomResponse> findAll() {
        return RoomMapper.toList(roomRepository.findAllFlat());
    }

    public RoomResponse findOne(Integer id) {
        return roomRepository.findFlatById(id)
                .map(RoomMapper::toResponse)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Phòng khám không tồn tại"));
    }

    public RoomResponse create(CreateRoomRequest req) {
        Room room = new Room();
        room.setName(req.getName());
        room.setActive(true);

        if (req.getDoctorId() != null) {
            doctorRepository.findById(req.getDoctorId()).ifPresent(room::setDoctor);
        }

        return responseOf(roomRepository.save(room));
    }

    public RoomResponse update(Integer id, CreateRoomRequest req) {
        Room room = findEntity(id);

        if (req.getName()   != null) room.setName(req.getName());
        if (req.getActive() != null) room.setActive(req.getActive());

        // doctorId có thể set null để bỏ gắn bác sĩ
        if (req.getDoctorId() != null) {
            doctorRepository.findById(req.getDoctorId()).ifPresent(room::setDoctor);
        } else if (req.getDoctorId() == null && req.getName() != null) {
            // chỉ clear doctor khi request có field doctorId = null tường minh
            room.setDoctor(null);
        }

        return responseOf(roomRepository.save(room));
    }

    /**
     * Bật / tắt phòng (lật trạng thái active).
     * Luật nghiệp vụ: KHÔNG cho tắt phòng khi vẫn còn bác sĩ phụ trách —
     * phải gỡ bác sĩ khỏi phòng trước. Bật lại thì không ràng buộc.
     */
    public RoomResponse toggleActive(Integer id) {
        Room room = findEntity(id);
        boolean currentlyActive = Boolean.TRUE.equals(room.getActive());

        if (currentlyActive && room.getDoctor() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Vui lòng gỡ bác sĩ phụ trách khỏi phòng trước khi tắt phòng.");
        }

        room.setActive(!currentlyActive);
        return responseOf(roomRepository.save(room));
    }

    /**
     * "Xoá" phòng = tắt mềm (active=false), không xoá hẳn khỏi DB.
     * Cũng áp dụng luật phải gỡ bác sĩ trước khi tắt.
     */
    public RoomResponse remove(Integer id) {
        Room room = findEntity(id);
        if (room.getDoctor() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Vui lòng gỡ bác sĩ phụ trách khỏi phòng trước khi tắt phòng.");
        }
        room.setActive(false);
        return responseOf(roomRepository.save(room));
    }

    // ── Nội bộ ──────────────────────────────────────────────
    private Room findEntity(Integer id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Phòng khám không tồn tại"));
    }

    /** Nạp lại bằng projection để trả response đầy đủ (kèm bác sĩ). */
    private RoomResponse responseOf(Room room) {
        return roomRepository.findFlatById(room.getId()).map(RoomMapper::toResponse).orElse(null);
    }
}
