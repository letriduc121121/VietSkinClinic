package com.vietskin.backend_springboot.modules.invoices.repository;

import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.modules.invoices.dto.InvoiceFlat;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    Optional<Invoice> findByInvoiceCode(String invoiceCode);
    Optional<Invoice> findByAppointmentId(Integer appointmentId);
    List<Invoice> findByPatientId(Integer patientId);
    List<Invoice> findByStatus(PaymentStatus status);
    List<Invoice> findByStatusAndPaidAtBetween(PaymentStatus status, LocalDateTime from, LocalDateTime to);
    long countByStatus(PaymentStatus status);

    // PROJECTION phẳng sang InvoiceFlat: chỉ select cột vô hướng + LEFT JOIN các quan hệ ToOne.
    // Không nạp entity User nên Hibernate không kích hoạt OneToOne/quan hệ LAZY → 1 query, hết N+1.
    String PROJECTION = "SELECT new com.vietskin.backend_springboot.modules.invoices.dto.InvoiceFlat(" +
            "i.id, i.invoiceCode, i.patientName, i.description, i.amount, i.status, i.method, " +
            "i.paidAt, i.note, i.createdAt, i.updatedAt, " +
            "p.id, p.name, p.phone, " +
            "rb.id, rb.name) " +
            "FROM Invoice i " +
            "LEFT JOIN i.patient p " +
            "LEFT JOIN i.receivedBy rb ";

    // Danh sách hóa đơn (findAll) — lọc status nếu khác null, mới nhất lên đầu
    @Query(PROJECTION + "WHERE (:status IS NULL OR i.status = :status) ORDER BY i.createdAt DESC")
    List<InvoiceFlat> searchFlat(@Param("status") PaymentStatus status);

    @Query(PROJECTION + "WHERE i.id = :id")
    Optional<InvoiceFlat> findFlatById(@Param("id") Integer id);

    @Query(PROJECTION + "WHERE p.id = :patientId ORDER BY i.createdAt DESC")
    List<InvoiceFlat> findFlatByPatientId(@Param("patientId") Integer patientId);

    // Đếm số hóa đơn đã tạo trong khoảng thời gian — dùng để sinh mã theo từng năm
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // Doanh thu theo dịch vụ — trả về [serviceName, sumAmount]
    // Đi qua quan hệ invoice -> appointment -> service; chỉ tính hoá đơn đã thanh toán.
    @Query("SELECT i.appointment.service.name, SUM(i.amount) FROM Invoice i " +
           "WHERE i.status = com.vietskin.backend_springboot.common.enums.PaymentStatus.paid " +
           "AND i.appointment IS NOT NULL AND i.appointment.service IS NOT NULL " +
           "GROUP BY i.appointment.service.id, i.appointment.service.name")
    List<Object[]> revenueByServicePaid();
}
