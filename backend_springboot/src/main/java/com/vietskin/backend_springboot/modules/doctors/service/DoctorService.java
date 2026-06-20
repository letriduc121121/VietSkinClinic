package com.vietskin.backend_springboot.modules.doctors.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.TimeSlotRepository;
import com.vietskin.backend_springboot.modules.doctors.dto.DoctorResponse;
import com.vietskin.backend_springboot.modules.doctors.dto.DoctorSlotsResponse;
import com.vietskin.backend_springboot.modules.doctors.dto.UpdateDoctorRequest;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.mapper.DoctorMapper;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorWorkDayRepository workDayRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final ObjectMapper objectMapper;

    // Cấu hình slot giờ làm — giống NestJS
    private static final int SLOT_DURATION = 20; // phút
    private static final int WORK_START  = 8  * 60; // 08:00
    private static final int LUNCH_START = 12 * 60; // 12:00
    private static final int LUNCH_END   = 13 * 60; // 13:00
    private static final int WORK_END    = 17 * 60; // 17:00

    private List<String> generateDailySlots() {
        List<String> slots = new ArrayList<>();
        int cur = WORK_START;
        while (cur < WORK_END) {
            if (cur >= LUNCH_START && cur < LUNCH_END) { cur = LUNCH_END; continue; }
            String h = String.format("%02d", cur / 60);
            String m = String.format("%02d", cur % 60);
            slots.add(h + ":" + m);
            cur += SLOT_DURATION;
        }
        return slots; // 24 slots: 08:00-11:40, 13:00-16:40
    }

    @Cacheable("doctors")
    public List<DoctorResponse> findAll() {
        return doctorRepository.findByActiveTrue().stream()
                .map(DoctorMapper::toResponse)
                .toList();
    }

    @Cacheable("doctors_admin")
    public List<DoctorResponse> findAllForAdmin() {
        return doctorRepository.findAll().stream()
                .sorted(Comparator.comparing(Doctor::getId))
                .map(DoctorMapper::toResponse)
                .toList();
    }

    @Caching(evict = {
            @CacheEvict(value = "doctors", allEntries = true),
            @CacheEvict(value = "doctors_admin", allEntries = true),
            @CacheEvict(value = "doctor_profile", key = "#id")
    })
    public DoctorResponse toggleActive(Integer id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bác sĩ không tồn tại"));
        doctor.setActive(!doctor.getActive());
        doctorRepository.save(doctor);
        return DoctorMapper.toResponse(doctor);
    }

    @Cacheable(value = "doctor_profile", key = "#id")
    public DoctorResponse findOne(Integer id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bác sĩ không tồn tại"));
        return DoctorMapper.toResponse(doctor);
    }

    public DoctorResponse findByUserId(Integer userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy hồ sơ bác sĩ"));
        return DoctorMapper.toResponse(doctor);
    }

    @Caching(evict = {
            @CacheEvict(value = "doctors", allEntries = true),
            @CacheEvict(value = "doctors_admin", allEntries = true),
            @CacheEvict(value = "doctor_profile", key = "#id")
    })
    public DoctorResponse update(Integer id, UpdateDoctorRequest req) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bác sĩ không tồn tại"));

        if (req.getSpecialty()       != null) doctor.setSpecialty(req.getSpecialty());
        if (req.getExperience()      != null) doctor.setExperience(req.getExperience());
        if (req.getDegree()          != null) doctor.setDegree(req.getDegree());
        if (req.getDescription()     != null) doctor.setDescription(req.getDescription());
        if (req.getConsultationFee() != null) doctor.setConsultationFee(req.getConsultationFee());
        if (req.getActive()          != null) doctor.setActive(req.getActive());
        if (req.getKeywords()        != null) {
            try {
                doctor.setKeywords(objectMapper.writeValueAsString(req.getKeywords()));
            } catch (Exception ignored) {}
        }

        doctorRepository.save(doctor);
        return DoctorMapper.toResponse(doctor);
    }

    @Cacheable(value = "doctor_slots", key = "#doctorId + '_' + #date")
    public DoctorSlotsResponse getAvailableSlots(Integer doctorId, String date) {
        LocalDate localDate = LocalDate.parse(date);

        var workDayOpt = workDayRepository.findByDoctorIdAndDate(doctorId, localDate);
        if (workDayOpt.isEmpty()) {
            return new DoctorSlotsResponse(date, null, List.of());
        }

        var workDay = workDayOpt.get();

        Set<String> bookedSet = new HashSet<>(
                appointmentRepository.findBookedSlots(doctorId, localDate)
        );
        Set<String> blockedSet = new HashSet<>(
                timeSlotRepository.findByDoctorIdAndDate(doctorId, localDate)
                        .stream()
                        .filter(ts -> ts.getIsBlocked())
                        .map(ts -> ts.getSlotTime())
                        .toList()
        );

        List<DoctorSlotsResponse.Slot> slots = generateDailySlots().stream()
                .map(time -> new DoctorSlotsResponse.Slot(time,
                        !bookedSet.contains(time) && !blockedSet.contains(time)))
                .toList();

        return new DoctorSlotsResponse(date,
                new DoctorSlotsResponse.WorkDayInfo(workDay.getRoom().getName()), slots);
    }
}
