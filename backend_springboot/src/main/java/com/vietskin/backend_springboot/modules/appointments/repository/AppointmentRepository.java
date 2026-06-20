package com.vietskin.backend_springboot.modules.appointments.repository;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.modules.appointments.dto.AppointmentFlat;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    // PROJECTION phẳng sang AppointmentFlat: chỉ select cột vô hướng + LEFT JOIN các quan hệ.
    // Không nạp entity User/Doctor nên Hibernate không kích hoạt OneToOne inverse → 1 query, hết N+1.
    String PROJECTION = "SELECT new com.vietskin.backend_springboot.modules.appointments.dto.AppointmentFlat(" +
            "a.id, a.patientName, a.patientPhone, a.patientEmail, a.time, a.date, a.status, a.symptoms, " +
            "a.queueNumber, a.createdAt, a.confirmedAt, " +
            "p.id, p.name, p.phone, " +
            "pp.patientCode, pp.dateOfBirth, pp.gender, pp.bloodType, pp.allergies, pp.medicalHistory, pp.province, pp.address, " +
            "d.id, du.name, du.avatar, d.consultationFee, " +
            "s.id, s.name, s.price, " +
            "i.id, i.status, i.amount) " +
            "FROM Appointment a " +
            "LEFT JOIN a.patient p " +
            "LEFT JOIN p.patientProfile pp " +
            "LEFT JOIN a.doctor d " +
            "LEFT JOIN d.user du " +
            "LEFT JOIN a.service s " +
            "LEFT JOIN a.invoice i ";

    // Lọc lịch hẹn ngay tại DB (tham số null = bỏ qua điều kiện)
    @Query(PROJECTION + "WHERE (:from IS NULL OR a.date >= :from) AND (:to IS NULL OR a.date <= :to) " +
            "AND (:doctorId IS NULL OR d.id = :doctorId) AND (:status IS NULL OR a.status = :status) " +
            "ORDER BY a.date DESC, a.time DESC")
    List<AppointmentFlat> searchFlat(@Param("from") LocalDate from, @Param("to") LocalDate to,
            @Param("doctorId") Integer doctorId, @Param("status") AppointmentStatus status);

    @Query(PROJECTION + "WHERE a.id = :id")
    Optional<AppointmentFlat> findFlatById(@Param("id") Integer id);

    @Query(PROJECTION + "WHERE p.id = :patientId ORDER BY a.date DESC")
    List<AppointmentFlat> findFlatByPatientId(@Param("patientId") Integer patientId);

    @Query(PROJECTION + "WHERE d.id = :doctorId AND a.date = :date")
    List<AppointmentFlat> findFlatByDoctorIdAndDate(@Param("doctorId") Integer doctorId,
            @Param("date") LocalDate date);

    @Query(PROJECTION + "WHERE a.patientPhone = :phone ORDER BY a.date DESC")
    List<AppointmentFlat> findFlatByPatientPhone(@Param("phone") String phone);

    // Bản entity (nhẹ) — dùng cho logic nội bộ: check trùng giờ, đếm STT, scheduler, chatbot
    List<Appointment> findByDoctorIdAndDate(Integer doctorId, LocalDate date);

    List<Appointment> findByPatientId(Integer patientId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByDoctorId(Integer doctorId);

    List<Appointment> findByDate(LocalDate date);

    // Lấy danh sách giờ đã đặt của bác sĩ trong ngày (trừ cancelled/no_show)
    @Query("SELECT a.time FROM Appointment a WHERE a.doctor.id = :doctorId AND a.date = :date " +
            "AND a.status NOT IN ('cancelled', 'no_show')")
    List<String> findBookedSlots(@Param("doctorId") Integer doctorId,
            @Param("date") LocalDate date);

    // Kiểm tra có lịch hẹn đã xác nhận trong ngày không (dùng khi xóa work day)
    boolean existsByDoctorIdAndDateAndStatusNotIn(Integer doctorId, LocalDate date,
            List<AppointmentStatus> statuses);

    // Tìm theo phone (walk-in lookup, bản entity nếu cần nội bộ)
    List<Appointment> findByPatientPhone(String patientPhone);

    // Tìm theo doctorId + date + status
    List<Appointment> findByDoctorIdAndDateAndStatus(Integer doctorId, LocalDate date,
            AppointmentStatus status);

    // Tìm lịch chưa check-in mà ngày khám đã qua → dùng cho auto no_show
    List<Appointment> findByStatusInAndDateBefore(List<AppointmentStatus> statuses, LocalDate date);

    // --- STATS ---

    // Lượt khám theo tháng (status=done) — trả về [year, month, count]
    @Query("SELECT YEAR(a.date), MONTH(a.date), COUNT(a) FROM Appointment a " +
           "WHERE a.status = com.vietskin.backend_springboot.common.enums.AppointmentStatus.done " +
           "AND a.date >= :from GROUP BY YEAR(a.date), MONTH(a.date) ORDER BY YEAR(a.date), MONTH(a.date)")
    List<Object[]> countDoneByMonth(@Param("from") LocalDate from);

    // Top bác sĩ theo số ca khám hoàn thành — trả về [doctorName, count]
    @Query("SELECT a.doctor.user.name, COUNT(a) FROM Appointment a " +
           "WHERE a.status = com.vietskin.backend_springboot.common.enums.AppointmentStatus.done " +
           "AND a.doctor IS NOT NULL " +
           "GROUP BY a.doctor.id, a.doctor.user.name ORDER BY COUNT(a) DESC")
    List<Object[]> topDoctorsByDoneCount(Pageable pageable);

    // Phân bổ trạng thái lịch hẹn — trả về [status, count]
    @Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countGroupByStatus();

    // Số lượt khám hoàn thành theo dịch vụ — trả về [serviceName, count]
    // Chỉ tính status=done và lịch có gắn dịch vụ (service IS NOT NULL)
    @Query("SELECT a.service.name, COUNT(a) FROM Appointment a " +
           "WHERE a.status = com.vietskin.backend_springboot.common.enums.AppointmentStatus.done " +
           "AND a.service IS NOT NULL " +
           "GROUP BY a.service.id, a.service.name ORDER BY COUNT(a) DESC")
    List<Object[]> countDoneByService();

    long countByStatus(AppointmentStatus status);
}
