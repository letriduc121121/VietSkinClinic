package com.vietskin.backend_springboot.modules.invoices.service;

import com.vietskin.backend_springboot.common.enums.PaymentMethod;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.utils.SecurityUtils;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.invoices.dto.CreateInvoiceRequest;
import com.vietskin.backend_springboot.modules.invoices.dto.InvoiceFlat;
import com.vietskin.backend_springboot.modules.invoices.dto.InvoiceResponse;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.invoices.mapper.InvoiceMapper;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import com.vietskin.backend_springboot.modules.users.entity.User;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AppWebSocketHandler wsHandler;

    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public InvoiceResponse create(CreateInvoiceRequest req, Integer receivedByUserId) {
        Appointment apt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Lịch hẹn không tồn tại"));

        // Kiểm tra đã có hóa đơn chưa
        Invoice existingInvoice = invoiceRepository.findByAppointmentId(req.getAppointmentId()).orElse(null);
        if (existingInvoice != null) {
            if (existingInvoice.getStatus() == PaymentStatus.unpaid) {
                // Cập nhật hóa đơn chưa thanh toán thành đã thanh toán
                existingInvoice.setStatus(PaymentStatus.paid);
                existingInvoice.setMethod(PaymentMethod.valueOf(req.getPaymentMethod()));
                existingInvoice.setPaidAt(LocalDateTime.now());
                existingInvoice.setReceivedBy(userRepository.findById(receivedByUserId).orElse(null));
                existingInvoice.setNote(req.getNote());

                Invoice saved = invoiceRepository.save(existingInvoice);
                notifyPatientOfSuccess(saved, apt);
                // Nạp lại bằng projection để trả response (patient/receivedBy) — tránh serialize entity LAZY
                return responseById(saved.getId());
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST, "Lịch hẹn này đã có hóa đơn");
            }
        }

        User receiver = userRepository.findById(receivedByUserId).orElse(null);

        Invoice invoice = Invoice.builder()
                .invoiceCode(nextInvoiceCode())
                .appointment(apt)
                .patient(apt.getPatient())
                .patientName(apt.getPatientName())
                .description(buildDescription(apt))
                .amount(computeAmount(apt))
                .status(PaymentStatus.paid)
                .method(PaymentMethod.valueOf(req.getPaymentMethod()))
                .paidAt(LocalDateTime.now())
                .receivedBy(receiver)
                .note(req.getNote())
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        notifyPatientOfSuccess(saved, apt);
        // Nạp lại bằng projection để trả response (patient/receivedBy) — tránh serialize entity LAZY
        return responseById(saved.getId());
    }

    /** Lấy InvoiceResponse theo id qua projection (dùng sau create). */
    private InvoiceResponse responseById(Integer id) {
        return invoiceRepository.findFlatById(id)
                .map(InvoiceMapper::toResponse)
                .orElse(null);
    }

    /**
     * Tạo hóa đơn "chưa thanh toán" khi lượt khám hoàn tất.
     * Chạy ở transaction riêng (REQUIRES_NEW) để nếu có lỗi cũng không làm rollback
     * việc cập nhật trạng thái lịch hẹn ở luồng gọi.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createUnpaidForAppointment(Appointment apt) {
        if (invoiceRepository.findByAppointmentId(apt.getId()).isPresent()) {
            return; // tránh tạo trùng
        }

        Invoice invoice = Invoice.builder()
                .invoiceCode(nextInvoiceCode())
                .appointment(apt)
                .patient(apt.getPatient())
                .patientName(apt.getPatientName())
                .description(buildDescription(apt))
                .amount(computeAmount(apt))
                .status(PaymentStatus.unpaid)
                .build();
        invoiceRepository.save(invoice);

        if (apt.getPatient() != null) {
            String amountStr = NumberFormat.getNumberInstance(new Locale("vi", "VN"))
                    .format(invoice.getAmount().longValue()) + "đ";
            notificationService.notifyUser(
                    apt.getPatient().getId(), "appointment",
                    "Yêu cầu thanh toán phí khám",
                    "Lượt khám của bạn đã hoàn tất. Vui lòng thanh toán số tiền " + amountStr
                            + " tại quầy lễ tân.");
        }
    }

    // ── Helper dùng chung khi dựng hóa đơn ──────────────────────────────────

    /** Sinh mã hóa đơn dạng INV-{năm}-{số thứ tự trong năm}. */
    private String nextInvoiceCode() {
        int year = LocalDate.now().getYear();
        LocalDateTime start = LocalDate.of(year, 1, 1).atStartOfDay();
        LocalDateTime end = LocalDate.of(year, 12, 31).atTime(LocalTime.MAX);
        long seq = invoiceRepository.countByCreatedAtBetween(start, end);
        // Cột invoice_code có ràng buộc UNIQUE nên DB luôn đảm bảo không trùng;
        // trường hợp đặt đồng thời hiếm gặp sẽ chỉ làm 1 request lỗi (không sinh mã trùng).
        return String.format("INV-%d-%04d", year, seq + 1);
    }

    private BigDecimal computeAmount(Appointment apt) {
        BigDecimal consultationFee = apt.getDoctor() != null && apt.getDoctor().getConsultationFee() != null
                ? apt.getDoctor().getConsultationFee()
                : BigDecimal.valueOf(150000);
        BigDecimal servicePrice = apt.getService() != null && apt.getService().getPrice() != null
                ? apt.getService().getPrice()
                : BigDecimal.ZERO;
        return consultationFee.add(servicePrice);
    }

    private String buildDescription(Appointment apt) {
        String doctorName = apt.getDoctor() != null && apt.getDoctor().getUser() != null
                ? apt.getDoctor().getUser().getName() : "Bác sĩ";
        StringBuilder desc = new StringBuilder("Phí khám - ").append(doctorName);
        if (apt.getService() != null) {
            desc.append(" | Dịch vụ: ").append(apt.getService().getName());
        }
        return desc.toString();
    }

    private void notifyPatientOfSuccess(Invoice invoice, Appointment apt) {
        if (apt.getPatient() != null) {
            try {
                // Format số tiền theo kiểu Việt Nam: 150,000 đ
                String amountStr = NumberFormat.getNumberInstance(new Locale("vi", "VN"))
                        .format(invoice.getAmount().longValue()) + " đ";

                notificationService.notifyUser(
                        apt.getPatient().getId(), "system",
                        "Thanh toán thành công",
                        "Hóa đơn " + invoice.getInvoiceCode() + " — " + amountStr
                                + " đã được ghi nhận. Cảm ơn bạn đã sử dụng dịch vụ VietSkin!"
                );

                // Ping WebSocket để chuông reload ngay nếu bệnh nhân đang online
                wsHandler.publishToPatient(apt.getPatient().getId(), "appointment_updated",
                        Map.of("appointmentId", apt.getId(), "status", "invoice_created"));
            } catch (Exception ignored) {}
        }
    }

    public List<InvoiceResponse> findAll(String status) {
        PaymentStatus st = status != null ? PaymentStatus.valueOf(status) : null;
        // Lọc + sắp xếp + projection thẳng sang DTO tại DB (1 query, tránh N+1 khi serialize)
        return InvoiceMapper.toList(invoiceRepository.searchFlat(st));
    }

    public InvoiceResponse findOne(Integer id) {
        InvoiceFlat f = invoiceRepository.findFlatById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Hóa đơn không tồn tại"));
        // Bệnh nhân chỉ được xem hóa đơn của chính mình (chống IDOR)
        SecurityUtils.requireSelfIfPatient(f.patientId());
        return InvoiceMapper.toResponse(f);
    }

    public List<InvoiceResponse> findByPatient(Integer patientId) {
        // Query đã ORDER BY createdAt DESC
        return InvoiceMapper.toList(invoiceRepository.findFlatByPatientId(patientId));
    }

    public Map<String, Object> getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        List<Invoice> invoices = invoiceRepository.findByStatusAndPaidAtBetween(
                PaymentStatus.paid, sixMonthsAgo, now);

        Map<String, Double> monthlyMap = new HashMap<>();
        Map<String, Double> methodMap = new HashMap<>();
        double todayTotal = 0, monthTotal = 0, grandTotal = 0;

        for (Invoice inv : invoices) {
            LocalDateTime paidAt = inv.getPaidAt() != null ? inv.getPaidAt() : now;
            double amount = inv.getAmount().doubleValue();
            String key = String.format("%d-%02d", paidAt.getYear(), paidAt.getMonthValue());

            monthlyMap.merge(key, amount, Double::sum);
            if (inv.getMethod() != null) {
                methodMap.merge(inv.getMethod().name(), amount, Double::sum);
            }
            if (!paidAt.isBefore(todayStart)) todayTotal += amount;
            if (!paidAt.isBefore(monthStart)) monthTotal += amount;
            grandTotal += amount;
        }

        // Build mảng 6 tháng gần nhất
        List<Map<String, Object>> monthly = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime d = now.minusMonths(i).withDayOfMonth(1);
            String k = String.format("%d-%02d", d.getYear(), d.getMonthValue());
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", k);
            entry.put("revenue", monthlyMap.getOrDefault(k, 0.0));
            monthly.add(entry);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("monthly", monthly);
        result.put("byMethod", methodMap);
        result.put("todayTotal", todayTotal);
        result.put("monthTotal", monthTotal);
        result.put("grandTotal", grandTotal);
        return result;
    }
}
