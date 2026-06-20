package com.vietskin.backend_springboot.modules.medical_records.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.utils.SecurityUtils;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.medical_records.dto.CreateMedicalRecordRequest;
import com.vietskin.backend_springboot.modules.medical_records.dto.MedicalRecordResponse;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.mapper.MedicalRecordMapper;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    // ── Bác sĩ tạo / cập nhật bệnh án (upsert theo appointmentId) ──
    @Transactional
    @CacheEvict(value = "medical_records", allEntries = true)
    public MedicalRecordResponse create(CreateMedicalRecordRequest req, Integer doctorUserId) {
        Appointment apt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Lịch hẹn không tồn tại"));

        // Bác sĩ chỉ được lập bệnh án cho lịch khám mình phụ trách
        Doctor doctor = doctorRepository.findByUserId(doctorUserId).orElse(null);
        if (doctor == null || apt.getDoctor() == null
                || !apt.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "Bạn chỉ được lập bệnh án cho lịch khám mình phụ trách");
        }

        // Nếu đã có bệnh án cho appointment này thì update, không tạo mới
        MedicalRecord record = medicalRecordRepository
                .findByAppointmentId(req.getAppointmentId())
                .orElse(new MedicalRecord());

        record.setSymptoms(req.getSymptoms());
        record.setDiagnosis(req.getDiagnosis());
        record.setSkinType(req.getSkinType());
        record.setLesionLocation(req.getLesionLocation());
        record.setTreatment(req.getTreatment());
        record.setNote(req.getNote());
        record.setFollowUpDate(req.getFollowUpDate());

        record.setAppointment(apt);

        if (apt.getPatient() != null) {
            record.setPatient(apt.getPatient());
        }
        record.setDoctor(doctor);

        log.info("Tạo/cập nhật bệnh án cho appointment={}, xóa cache medical_records", req.getAppointmentId());
        MedicalRecord saved = medicalRecordRepository.save(record);
        // Nạp lại kèm quan hệ rồi map sang DTO (vẫn trong transaction nên init LAZY an toàn)
        return loadResponse(saved.getId());
    }

    // ── Bệnh nhân / Staff xem theo patientId ────────────────
    @Cacheable(value = "medical_records", key = "#patientId")
    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> findByPatient(Integer patientId) {
        log.info("Cache MISS – truy vấn DB hồ sơ bệnh án cho patientId={}", patientId);
        List<MedicalRecord> records = medicalRecordRepository.findWithRelationsByPatientId(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
        return MedicalRecordMapper.toList(records);
    }

    // ── Chi tiết 1 bệnh án ───────────────────────────────────
    @Transactional(readOnly = true)
    public MedicalRecordResponse findOne(Integer id) {
        MedicalRecord record = findEntity(id);
        return MedicalRecordMapper.toResponse(record);
    }

    // ── Bệnh án theo lịch hẹn (null nếu chưa lập) ────────────
    @Transactional(readOnly = true)
    public MedicalRecordResponse findByAppointment(Integer appointmentId) {
        return medicalRecordRepository.findByAppointmentId(appointmentId)
                .map(r -> findEntity(r.getId()))
                .map(MedicalRecordMapper::toResponse)
                .orElse(null);
    }

    // ── Tải entity + check IDOR (dùng nội bộ cho findOne/update) ──
    private MedicalRecord findEntity(Integer id) {
        MedicalRecord record = medicalRecordRepository.findWithRelationsById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Bệnh án không tồn tại"));
        // Bệnh nhân chỉ được xem bệnh án của chính mình (chống IDOR)
        SecurityUtils.requireSelfIfPatient(record.getPatient() != null ? record.getPatient().getId() : null);
        return record;
    }

    // ── Nạp lại bệnh án kèm quan hệ rồi map sang DTO ──
    private MedicalRecordResponse loadResponse(Integer id) {
        MedicalRecord record = medicalRecordRepository.findWithRelationsById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bệnh án không tồn tại"));
        return MedicalRecordMapper.toResponse(record);
    }

    // ── Bác sĩ cập nhật bệnh án ─────────────────────────────
    @CacheEvict(value = "medical_records", allEntries = true)
    @Transactional
    public MedicalRecordResponse update(Integer id, CreateMedicalRecordRequest req) {
        MedicalRecord record = findEntity(id);

        // Bác sĩ chỉ được sửa bệnh án mình phụ trách
        Doctor current = doctorRepository.findByUserId(SecurityUtils.currentUserId()).orElse(null);
        if (current == null || record.getDoctor() == null
                || !record.getDoctor().getId().equals(current.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền sửa bệnh án của bác sĩ khác");
        }

        if (req.getSymptoms()       != null) record.setSymptoms(req.getSymptoms());
        if (req.getDiagnosis()      != null) record.setDiagnosis(req.getDiagnosis());
        if (req.getSkinType()       != null) record.setSkinType(req.getSkinType());
        if (req.getLesionLocation() != null) record.setLesionLocation(req.getLesionLocation());
        if (req.getTreatment()      != null) record.setTreatment(req.getTreatment());
        if (req.getNote()           != null) record.setNote(req.getNote());
        if (req.getFollowUpDate()   != null) record.setFollowUpDate(req.getFollowUpDate());

        log.info("Cập nhật bệnh án id={}, xóa cache medical_records", id);
        MedicalRecord saved = medicalRecordRepository.save(record);
        return MedicalRecordMapper.toResponse(saved);
    }
}

