package com.vietskin.backend_springboot.modules.prescriptions.repository;

import com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    // Bệnh nhân không lưu trực tiếp trên prescription nữa → truy qua appointment.patient.id
    List<Prescription> findByAppointment_Patient_Id(Integer patientId);
    Optional<Prescription> findByAppointmentId(Integer appointmentId);
    List<Prescription> findByMedicalRecordId(Integer medicalRecordId);

    // ── Các finder nạp sẵn quan hệ (EntityGraph) để map sang DTO an toàn ──
    // khi tắt FORCE_LAZY_LOADING. Đặt tên khác method cũ, không đụng method đang dùng.

    /** Chi tiết 1 đơn thuốc, nạp kèm appointment + items + medicine. */
    @EntityGraph(attributePaths = {"appointment", "items", "items.medicine"})
    Optional<Prescription> findWithDetailsById(Integer id);

    /** Đơn thuốc theo lịch hẹn, nạp kèm quan hệ. */
    @EntityGraph(attributePaths = {"appointment", "items", "items.medicine"})
    Optional<Prescription> findWithDetailsByAppointmentId(Integer appointmentId);

    /** Các đơn thuốc theo bệnh án, nạp kèm quan hệ. */
    @EntityGraph(attributePaths = {"appointment", "items", "items.medicine"})
    List<Prescription> findWithDetailsByMedicalRecordId(Integer medicalRecordId);

    /** Các đơn thuốc của 1 bệnh nhân (qua appointment.patient.id), nạp kèm quan hệ. */
    @EntityGraph(attributePaths = {"appointment", "items", "items.medicine"})
    List<Prescription> findWithDetailsByAppointment_Patient_Id(Integer patientId);
}
