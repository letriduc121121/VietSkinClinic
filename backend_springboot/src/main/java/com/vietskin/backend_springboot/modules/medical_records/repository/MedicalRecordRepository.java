package com.vietskin.backend_springboot.modules.medical_records.repository;

import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Integer> {
    List<MedicalRecord> findByPatientId(Integer patientId);
    List<MedicalRecord> findByDoctorId(Integer doctorId);
    Optional<MedicalRecord> findByAppointmentId(Integer appointmentId);
    List<MedicalRecord> findByFollowUpDateAndPatientIsNotNull(LocalDate followUpDate);

    // --- FINDER cho DTO ---
    // Chỉ fetch các quan hệ ToOne (appointment + service, doctor + user) bằng EntityGraph
    // để tránh N+1 khi map. KHÔNG fetch images/prescriptions ở đây (2 collection cùng lúc
    // dễ gây MultipleBagFetchException) — chúng được init lazy trong session khi map.
    @EntityGraph(attributePaths = {"appointment", "appointment.service", "doctor", "doctor.user"})
    Optional<MedicalRecord> findWithRelationsById(Integer id);

    @EntityGraph(attributePaths = {"appointment", "appointment.service", "doctor", "doctor.user"})
    List<MedicalRecord> findWithRelationsByPatientId(Integer patientId);

    // --- STATS ---

    // Top chẩn đoán phổ biến — trả về [diagnosis, count]
    // Bỏ qua diagnosis null hoặc rỗng
    @Query("SELECT m.diagnosis, COUNT(m) FROM MedicalRecord m " +
           "WHERE m.diagnosis IS NOT NULL AND m.diagnosis <> '' " +
           "GROUP BY m.diagnosis ORDER BY COUNT(m) DESC")
    List<Object[]> topDiagnoses(Pageable pageable);
}
