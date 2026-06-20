package com.vietskin.backend_springboot.modules.doctor_work_days.service;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.BulkCreateWorkDayRequest;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.BulkCreateWorkDayResponse;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.CreateWorkDayRequest;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.WorkDayResponse;
import com.vietskin.backend_springboot.modules.doctor_work_days.entity.DoctorWorkDay;
import com.vietskin.backend_springboot.modules.doctor_work_days.mapper.WorkDayMapper;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.rooms.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DoctorWorkDayService {

    private final DoctorWorkDayRepository workDayRepository;
    private final RoomRepository roomRepository;
    private final AppointmentRepository appointmentRepository;

    private static final String[] DAY_NAMES = {
            "Chủ nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"
    };

    // Chỉ T2-T7, không phân CN
    private void validateWeekday(LocalDate date) {
        if (date.getDayOfWeek().getValue() == 7) { // Sunday
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Ngày " + date + " là Chủ nhật — không phân lịch ngày Chủ nhật");
        }
    }

    // Resolve roomId từ phòng được gán cho bác sĩ
    private Integer resolveRoom(Integer doctorId, Integer roomId) {
        if (roomId != null) return roomId;
        return roomRepository.findByDoctorId(doctorId)
                .map(r -> r.getId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "Bác sĩ chưa được phân phòng — vui lòng gán phòng trước"));
    }

    public List<WorkDayResponse> findByMonth(String month, Integer doctorId) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate from = ym.atDay(1);
        LocalDate to   = ym.atEndOfMonth();

        List<DoctorWorkDay> list = doctorId != null
                ? workDayRepository.findByDoctorIdAndDateBetween(doctorId, from, to)
                : workDayRepository.findAll().stream()
                .filter(w -> !w.getDate().isBefore(from) && !w.getDate().isAfter(to))
                .toList();

        return list.stream().map(WorkDayMapper::toResponse).toList();
    }

    public WorkDayResponse create(CreateWorkDayRequest req, Integer adminId) {
        validateWeekday(req.getDate());
        Integer roomId = resolveRoom(req.getDoctorId(), req.getRoomId());

        if (workDayRepository.existsByDoctorIdAndDate(req.getDoctorId(), req.getDate()))
            throw new AppException(HttpStatus.CONFLICT,
                    "Bác sĩ đã có lịch làm ngày " + req.getDate());

        DoctorWorkDay wd = buildWorkDay(req.getDoctorId(), roomId, req.getDate(), adminId);
        workDayRepository.save(wd);

        return new WorkDayResponse(wd.getId(), req.getDate(), req.getDoctorId(), null, roomId, null);
    }

    public BulkCreateWorkDayResponse bulkCreate(BulkCreateWorkDayRequest req, Integer adminId) {
        List<LocalDate> uniqueDates = req.getDates().stream().distinct().toList();
        for (LocalDate d : uniqueDates) validateWeekday(d);

        Integer roomId = resolveRoom(req.getDoctorId(), req.getRoomId());

        List<BulkCreateWorkDayResponse.Created> success = new ArrayList<>();
        List<BulkCreateWorkDayResponse.Failed> failed  = new ArrayList<>();

        for (LocalDate date : uniqueDates) {
            if (workDayRepository.existsByDoctorIdAndDate(req.getDoctorId(), date)) {
                failed.add(new BulkCreateWorkDayResponse.Failed(date, "Bác sĩ đã có lịch ngày này"));
                continue;
            }
            try {
                workDayRepository.save(buildWorkDay(req.getDoctorId(), roomId, date, adminId));
                success.add(new BulkCreateWorkDayResponse.Created(date, roomId));
            } catch (Exception e) {
                failed.add(new BulkCreateWorkDayResponse.Failed(date, "Lỗi không xác định"));
            }
        }

        return new BulkCreateWorkDayResponse(success, failed);
    }

    public void remove(Integer id) {
        DoctorWorkDay wd = workDayRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Lịch làm việc không tồn tại"));

        boolean hasConfirmed = appointmentRepository
                .existsByDoctorIdAndDateAndStatusNotIn(
                        wd.getDoctor().getId(), wd.getDate(),
                        List.of(AppointmentStatus.cancelled, AppointmentStatus.no_show, AppointmentStatus.pending)
                );

        if (hasConfirmed)
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể xóa — ngày này đã có lịch hẹn bệnh nhân đã xác nhận");

        workDayRepository.deleteById(id);
    }

    private DoctorWorkDay buildWorkDay(Integer doctorId, Integer roomId, LocalDate date, Integer adminId) {
        DoctorWorkDay wd = new DoctorWorkDay();
        wd.setDate(date);
        wd.setCreatedBy(adminId);

        var doctor = new com.vietskin.backend_springboot.modules.doctors.entity.Doctor();
        doctor.setId(doctorId);
        wd.setDoctor(doctor);

        var room = new com.vietskin.backend_springboot.modules.rooms.entity.Room();
        room.setId(roomId);
        wd.setRoom(room);
        return wd;
    }
}
