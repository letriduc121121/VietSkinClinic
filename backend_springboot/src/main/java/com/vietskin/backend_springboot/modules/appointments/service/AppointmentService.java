package com.vietskin.backend_springboot.modules.appointments.service;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.utils.SecurityUtils;
import com.vietskin.backend_springboot.modules.appointments.dto.AppointmentFlat;
import com.vietskin.backend_springboot.modules.appointments.dto.AppointmentResponse;
import com.vietskin.backend_springboot.modules.appointments.dto.CreateAppointmentRequest;
import com.vietskin.backend_springboot.modules.appointments.dto.UpdateStatusRequest;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.mapper.AppointmentMapper;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.invoices.service.InvoiceService;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Component("appointmentService")
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorWorkDayRepository doctorWorkDayRepository;
    private final AppWebSocketHandler wsHandler;
    private final NotificationService notificationService;
    private final InvoiceService invoiceService;

    private static final DateTimeFormatter VN_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    /** Có lịch hẹn còn hiệu lực (không cancelled/no_show) trùng khung giờ của bác sĩ không. */
    private boolean hasSlotConflict(Integer doctorId, LocalDate date, String time) {
        return appointmentRepository.findByDoctorIdAndDate(doctorId, date).stream()
                .anyMatch(a -> time.equals(a.getTime())
                        && a.getStatus() != AppointmentStatus.cancelled
                        && a.getStatus() != AppointmentStatus.no_show);
    }

    /** Các trạng thái đã được tính vào hàng chờ (đã/đang/đã xong khám) → dùng để cấp STT tiếp theo. */
    private static final EnumSet<AppointmentStatus> QUEUE_COUNTED_STATUSES = EnumSet.of(
            AppointmentStatus.checked_in, AppointmentStatus.in_progress, AppointmentStatus.done);

    /**
     * STT kế tiếp cho bác sĩ trong ngày = số lịch đã vào hàng chờ + 1.
     * PHẢI gọi sau khi đã giữ khóa {@code lockByDoctorIdAndDate} để không bị trùng STT khi chạy đồng thời.
     */
    private int nextQueueNumber(Integer doctorId, LocalDate date) {
        long count = appointmentRepository.findByDoctorIdAndDate(doctorId, date).stream()
                .filter(a -> QUEUE_COUNTED_STATUSES.contains(a.getStatus()))
                .count();
        return (int) count + 1;
    }

    // Các transition hợp lệ — giống NestJS
    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
            "pending",     List.of("confirmed", "checked_in", "cancelled"),
            "confirmed",   List.of("checked_in", "cancelled", "no_show"),
            "checked_in",  List.of("in_progress", "no_show"),
            "in_progress", List.of("done"),
            "done",        List.of(),
            "cancelled",   List.of(),
            "no_show",     List.of()
    );

    // ── Đặt lịch ────────────────────────────────────────────
    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public AppointmentResponse create(CreateAppointmentRequest req, Integer userId) {
        boolean isWalkin = Boolean.TRUE.equals(req.getIsWalkin());

        // Giờ khám — walk-in xếp hàng theo STT nên dùng giờ hiện tại nếu không truyền giờ cụ thể
        boolean hasExplicitTime = req.getTime() != null;
        String appointmentTime = hasExplicitTime
                ? req.getTime()
                : LocalTime.now().format(HH_MM);
        final String finalTime = appointmentTime;

        // Không cho đặt lịch vào quá khứ
        LocalDate today = LocalDate.now();
        if (req.getDate().isBefore(today)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể đặt lịch cho ngày trong quá khứ");
        }
        if (req.getDate().isEqual(today) && finalTime.compareTo(LocalTime.now().format(HH_MM)) < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể đặt lịch cho thời điểm đã qua trong ngày");
        }

        // Khóa ghi dòng lịch làm việc của bác sĩ trong ngày: vừa kiểm tra bác sĩ có làm việc ngày đó,
        // vừa serialize các request đặt lịch đồng thời cho cùng (bác sĩ, ngày) → chống double-booking
        // và trùng STT. Khóa được giữ tới khi transaction commit nên check-trùng + lưu là một thể thống nhất.
        if (doctorWorkDayRepository.lockByDoctorIdAndDate(req.getDoctorId(), req.getDate()).isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Bác sĩ không có lịch làm việc vào ngày " + req.getDate()
                    + ". Vui lòng chọn bác sĩ khác hoặc ngày khác.");
        }

        // Check trùng khung giờ khi có giờ cụ thể (online booking, hoặc walk-in được chọn giờ).
        // Walk-in không chọn giờ thì xếp theo STT nên không tính là trùng.
        if (hasExplicitTime && hasSlotConflict(req.getDoctorId(), req.getDate(), finalTime)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Khung giờ này đã có người đặt");
        }

        // Walk-in: cấp STT ngay
        Integer queueNumber = null;
        AppointmentStatus initialStatus = isWalkin
                ? AppointmentStatus.checked_in
                : AppointmentStatus.pending;

        if (isWalkin) {
            // An toàn nhờ khóa lịch làm việc đã giữ ở trên → không bị trùng STT khi đăng ký đồng thời
            queueNumber = nextQueueNumber(req.getDoctorId(), req.getDate());
        }

        // Resolve patientId.
        // Bệnh nhân chỉ được đặt lịch cho CHÍNH MÌNH — bỏ qua patientId gửi lên (chống đặt lịch hộ/mạo danh).
        // Lễ tân/admin mới được đặt hộ bằng patientId trong request.
        Integer patientId;
        if (SecurityUtils.hasRole("patient")) {
            patientId = userId;
        } else {
            patientId = req.getPatientId() != null ? req.getPatientId() : userId;
        }

        Appointment apt = new Appointment();
        apt.setPatientName(req.getPatientName());
        apt.setPatientPhone(req.getPatientPhone());
        apt.setPatientEmail(req.getPatientEmail());
        apt.setDate(req.getDate());
        apt.setTime(appointmentTime);
        apt.setSymptoms(req.getSymptoms());
        apt.setStatus(initialStatus);
        apt.setQueueNumber(queueNumber);

        if (patientId != null) {
            var patient = new com.vietskin.backend_springboot.modules.users.entity.User();
            patient.setId(patientId);
            apt.setPatient(patient);
        }

        var doctor = new Doctor();
        doctor.setId(req.getDoctorId());
        apt.setDoctor(doctor);

        if (req.getServiceId() != null) {
            var service = new Service();
            service.setId(req.getServiceId());
            apt.setService(service);
        }

        Appointment saved = appointmentRepository.save(apt);
        String ptName = saved.getPatientName() != null ? saved.getPatientName() : "Bệnh nhân";
        wsHandler.publishToReceptionist("appointment_created", Map.of(
                "appointmentId", saved.getId(),
                "date",          saved.getDate().toString(),
                "patientName",   ptName
        ));
        if (isWalkin) {
            wsHandler.publishToDoctor(saved.getDoctor().getId(), "queue_updated",
                    Map.of("doctorId", saved.getDoctor().getId()));
        }
        // Nạp lại bằng projection để trả response đầy đủ (doctor/service/patient...)
        return responseById(saved.getId());
    }

    /** Lấy AppointmentResponse theo id qua projection (dùng sau create/update/cancel). */
    private AppointmentResponse responseById(Integer id) {
        return appointmentRepository.findFlatById(id)
                .map(AppointmentMapper::toResponse)
                .orElse(null);
    }

    // ── Lễ tân/Admin xem tất cả (có filter) ─────────────────
    // Cache theo bộ lọc (SimpleKey gộp cả 5 tham số). TTL ngắn 30s + evict khi có
    // đặt/đổi trạng thái/hủy để lễ tân luôn thấy danh sách mới nhất.
    @Cacheable("appointments_list")
    public List<AppointmentResponse> findAll(String date, String dateFrom, String dateTo,
                                             Integer doctorId, String status) {
        try {
            // "date" lọc đúng 1 ngày; nếu không có thì dùng khoảng dateFrom..dateTo
            LocalDate from = date != null ? LocalDate.parse(date)
                    : (dateFrom != null ? LocalDate.parse(dateFrom) : null);
            LocalDate to = date != null ? LocalDate.parse(date)
                    : (dateTo != null ? LocalDate.parse(dateTo) : null);
            AppointmentStatus st = status != null ? AppointmentStatus.valueOf(status) : null;
            // Lọc + sắp xếp + projection thẳng sang DTO tại DB (1 query, tránh tải cả bảng về RAM, tránh N+1)
            return AppointmentMapper.toList(appointmentRepository.searchFlat(from, to, doctorId, st));
        } catch (DateTimeParseException | IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tham số lọc không hợp lệ");
        }
    }

    // ── Chi tiết 1 lịch hẹn (entity, dùng nội bộ cho update/cancel + kiểm tra IDOR) ──
    public Appointment findOne(Integer id) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Lịch hẹn không tồn tại"));
        // Bệnh nhân chỉ được xem lịch hẹn của chính mình (chống IDOR)
        SecurityUtils.requireSelfIfPatient(apt.getPatient() != null ? apt.getPatient().getId() : null);
        return apt;
    }

    // ── Chi tiết 1 lịch hẹn (DTO, cho controller getById) ──
    public AppointmentResponse getById(Integer id) {
        AppointmentFlat f = appointmentRepository.findFlatById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Lịch hẹn không tồn tại"));
        SecurityUtils.requireSelfIfPatient(f.patientId());
        return AppointmentMapper.toResponse(f);
    }

    // ── Slot đã đặt (public) ─────────────────────────────────
    public List<String> getBookedSlots(Integer doctorId, String date) {
        return appointmentRepository.findBookedSlots(doctorId, LocalDate.parse(date));
    }

    // ── Bệnh nhân xem lịch của mình ─────────────────────────
    public List<AppointmentResponse> findByPatient(Integer patientId) {
        // Query đã ORDER BY date DESC
        return AppointmentMapper.toList(appointmentRepository.findFlatByPatientId(patientId));
    }

    // ── Lễ tân tra cứu bệnh nhân qua SĐT ───────────────────
    public Map<String, Object> lookupByPhone(String phone, String date) {
        LocalDate filterDate = date != null ? LocalDate.parse(date) : null;
        List<AppointmentResponse> appointments = appointmentRepository.findFlatByPatientPhone(phone)
                .stream()
                .filter(a -> a.status() != AppointmentStatus.cancelled
                        && a.status() != AppointmentStatus.no_show)
                .filter(a -> filterDate == null || a.date().equals(filterDate))
                .map(AppointmentMapper::toResponse)
                .toList();

        return Map.of("appointments", appointments);
    }

    // ── Hàng chờ (checked_in + in_progress) ─────────────────
    public List<AppointmentResponse> findQueue(Integer doctorId, String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        return appointmentRepository.findFlatByDoctorIdAndDate(doctorId, targetDate)
                .stream()
                .filter(a -> a.status() == AppointmentStatus.checked_in
                        || a.status() == AppointmentStatus.in_progress)
                .sorted(Comparator.comparing(a -> a.queueNumber() != null
                        ? a.queueNumber() : Integer.MAX_VALUE))
                .map(AppointmentMapper::toResponse)
                .toList();
    }

    // ── Lịch ngày (toàn bộ confirmed/checked_in/done) ───────
    public List<AppointmentResponse> findDaySchedule(Integer doctorId, String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        return appointmentRepository.findFlatByDoctorIdAndDate(doctorId, targetDate)
                .stream()
                .filter(a -> a.status() == AppointmentStatus.confirmed
                        || a.status() == AppointmentStatus.checked_in
                        || a.status() == AppointmentStatus.in_progress
                        || a.status() == AppointmentStatus.done)
                .sorted(Comparator.comparing(a -> a.queueNumber() != null
                        ? a.queueNumber() : Integer.MAX_VALUE))
                .map(AppointmentMapper::toResponse)
                .toList();
    }

    // ── Cập nhật trạng thái ──────────────────────────────────
    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public AppointmentResponse updateStatus(Integer id, UpdateStatusRequest req, Integer currentUserId) {
        Appointment apt = findOne(id);

        // Kiểm tra transition hợp lệ
        List<String> allowed = VALID_TRANSITIONS.getOrDefault(
                apt.getStatus().name(), List.of());
        if (!allowed.contains(req.getStatus())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể chuyển từ \"" + apt.getStatus()
                            + "\" sang \"" + req.getStatus() + "\"");
        }

        // Ghi lại lễ tân/admin duyệt lịch khi chuyển sang "confirmed"
        if ("confirmed".equals(req.getStatus()) && currentUserId != null
                && apt.getConfirmedBy() == null) {
            var confirmer = new com.vietskin.backend_springboot.modules.users.entity.User();
            confirmer.setId(currentUserId);
            apt.setConfirmedBy(confirmer);
            apt.setConfirmedAt(LocalDateTime.now());
        }

        // Cấp STT khi check-in (nếu chưa có)
        if ("checked_in".equals(req.getStatus()) && apt.getQueueNumber() == null) {
            // Khóa lịch làm việc để hai lần check-in đồng thời (cùng bác sĩ/ngày) không cấp trùng STT
            doctorWorkDayRepository.lockByDoctorIdAndDate(apt.getDoctor().getId(), apt.getDate());
            apt.setQueueNumber(nextQueueNumber(apt.getDoctor().getId(), apt.getDate()));
        }

        apt.setStatus(AppointmentStatus.valueOf(req.getStatus()));
        Appointment saved = appointmentRepository.save(apt);

        // Payload chung cho appointment_updated
        Map<String, Object> updPayload = new HashMap<>();
        updPayload.put("appointmentId", saved.getId());
        updPayload.put("status", req.getStatus());
        updPayload.put("queueNumber", saved.getQueueNumber());

        // Gửi cho lễ tân
        wsHandler.publishToReceptionist("appointment_updated", updPayload);

        // Gửi cho bệnh nhân nếu có tài khoản (không phải walk-in ẩn danh)
        if (saved.getPatient() != null) {
            wsHandler.publishToPatient(saved.getPatient().getId(), "appointment_updated", updPayload);

            // Lưu DB notification để hiện trong chuông ngay cả khi bệnh nhân offline
            try {
                Integer patientUserId = saved.getPatient().getId();
                String dateStr = saved.getDate().format(VN_DATE);
                String timeStr = saved.getTime() != null ? saved.getTime() : "";

                switch (req.getStatus()) {
                    case "confirmed" -> notificationService.notifyUser(
                            patientUserId, "appointment",
                            "Lịch khám đã được xác nhận",
                            "Lịch khám ngày " + dateStr + " lúc " + timeStr + " tại VietSkin đã được xác nhận."
                    );
                    case "in_progress" -> notificationService.notifyUser(
                            patientUserId, "appointment",
                            "Đến lượt của bạn!",
                            "Bác sĩ đang gọi bạn vào khám. Vui lòng chuẩn bị."
                    );
                    case "done" -> notificationService.notifyUser(
                            patientUserId, "appointment",
                            "Khám bệnh hoàn thành",
                            "Cảm ơn bạn đã đến khám tại VietSkin. Chúc bạn mau khỏe!"
                    );
                    default -> { /* các trạng thái khác không cần notify */ }
                }
            } catch (Exception ignored) {}
        }

        // Gửi cho bác sĩ khi hàng chờ thay đổi
        if ("checked_in".equals(req.getStatus()) || "in_progress".equals(req.getStatus()) || "done".equals(req.getStatus())) {
            wsHandler.publishToDoctor(saved.getDoctor().getId(), "queue_updated",
                    Map.of("doctorId", saved.getDoctor().getId()));
        }

        // Thông báo lễ tân khi khám xong để thu tiền
        if ("done".equals(req.getStatus())) {
            try {
                invoiceService.createUnpaidForAppointment(saved);
            } catch (Exception e) {
                // Không làm hỏng việc cập nhật trạng thái lịch hẹn, nhưng phải log để lễ tân/dev biết
                // (ca khám done mà thiếu hóa đơn → cần tạo thủ công khi thu tiền)
                log.error("Không tạo được hóa đơn cho appointment id={} sau khi khám xong: {}",
                        saved.getId(), e.getMessage(), e);
            }
            try {
                String patientName = (saved.getPatientName() != null && !saved.getPatientName().isBlank())
                        ? saved.getPatientName()
                        : (saved.getPatient() != null ? saved.getPatient().getName() : "Khách lẻ");
                String doctorName = (saved.getDoctor() != null && saved.getDoctor().getUser() != null)
                        ? saved.getDoctor().getUser().getName() : "Bác sĩ";
                wsHandler.publishToReceptionist("examination_completed", Map.of(
                        "appointmentId", saved.getId(),
                        "patientName", patientName,
                        "doctorName", doctorName
                ));
            } catch (Exception ignored) {
                // Không để lỗi notification phá vỡ transaction
            }
        }

        return responseById(saved.getId());
    }

    // ── Hủy lịch ────────────────────────────────────────────
    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public AppointmentResponse cancel(Integer id) {
        // findOne đã chặn bệnh nhân hủy lịch của người khác (IDOR)
        Appointment apt = findOne(id);

        if (apt.getStatus() == AppointmentStatus.done
                || apt.getStatus() == AppointmentStatus.in_progress
                || apt.getStatus() == AppointmentStatus.cancelled) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể hủy lịch hẹn này");
        }

        apt.setStatus(AppointmentStatus.cancelled);
        Appointment saved = appointmentRepository.save(apt);

        // Gửi thông báo cho lễ tân
        wsHandler.publishToReceptionist("appointment_updated", Map.of(
                "appointmentId", saved.getId(),
                "status", "cancelled"
        ));

        // Gửi thông báo cho bác sĩ để cập nhật hàng chờ
        wsHandler.publishToDoctor(saved.getDoctor().getId(), "queue_updated",
                Map.of("doctorId", saved.getDoctor().getId()));

        // Gửi thông báo cho bệnh nhân nếu có tài khoản
        if (saved.getPatient() != null) {
            wsHandler.publishToPatient(saved.getPatient().getId(), "appointment_updated", Map.of(
                    "appointmentId", saved.getId(),
                    "status", "cancelled"
            ));
            // Lưu DB notification — bệnh nhân thấy trong chuông kể cả khi offline
            try {
                String dateStr = saved.getDate().format(VN_DATE);
                String timeStr = saved.getTime() != null ? saved.getTime() : "";
                notificationService.notifyUser(
                        saved.getPatient().getId(), "appointment",
                        "Lịch khám đã bị hủy",
                        "Lịch khám ngày " + dateStr + " lúc " + timeStr + " đã bị hủy. Vui lòng đặt lại nếu cần."
                );
            } catch (Exception ignored) {}
        }

        return responseById(saved.getId());
    }
}
