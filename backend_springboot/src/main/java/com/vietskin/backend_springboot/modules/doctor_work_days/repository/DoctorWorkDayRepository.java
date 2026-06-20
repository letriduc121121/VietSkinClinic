package com.vietskin.backend_springboot.modules.doctor_work_days.repository;

import com.vietskin.backend_springboot.modules.doctor_work_days.entity.DoctorWorkDay;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DoctorWorkDayRepository extends JpaRepository<DoctorWorkDay, Integer> {
    List<DoctorWorkDay> findByDoctorId(Integer doctorId);
    List<DoctorWorkDay> findByDate(LocalDate date);
    List<DoctorWorkDay> findByDoctorIdAndDateBetween(Integer doctorId, LocalDate from, LocalDate to);
    Optional<DoctorWorkDay> findByDoctorIdAndDate(Integer doctorId, LocalDate date);
    boolean existsByDoctorIdAndDate(Integer doctorId, LocalDate date);

    /**
     * Khóa ghi (SELECT ... FOR UPDATE) dòng lịch làm việc của bác sĩ trong ngày.
     * Dùng để serialize việc đặt lịch / cấp số thứ tự cho cùng (bác sĩ, ngày):
     * hai request đồng thời sẽ phải xếp hàng, tránh double-booking và trùng STT.
     * BẮT BUỘC gọi trong transaction (giữ khóa tới khi commit).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM DoctorWorkDay w WHERE w.doctor.id = :doctorId AND w.date = :date")
    Optional<DoctorWorkDay> lockByDoctorIdAndDate(@Param("doctorId") Integer doctorId,
            @Param("date") LocalDate date);
}
