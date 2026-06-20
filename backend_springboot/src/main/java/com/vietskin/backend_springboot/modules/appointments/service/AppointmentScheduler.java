package com.vietskin.backend_springboot.modules.appointments.service;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Tự động đánh dấu no_show cho các lịch hẹn mà bệnh nhân không đến check-in.
 *
 * Điều kiện: status còn pending hoặc confirmed, và ngày khám đã qua (< hôm nay).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentScheduler {

    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppWebSocketHandler wsHandler;
    private final NotificationService notificationService;

    private static final DateTimeFormatter VN_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Chạy lúc 00:05 mỗi ngày.
     * Cron format: giây phút giờ ngày tháng thứ
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void autoMarkNoShow() {
        LocalDate today = LocalDate.now();

        // Bước 1: Tìm tất cả lịch pending/confirmed mà ngày khám < hôm nay
        List<Appointment> expired = appointmentRepository.findByStatusInAndDateBefore(
                List.of(AppointmentStatus.pending, AppointmentStatus.confirmed),
                today
        );

        if (expired.isEmpty()) {
            log.info("[Scheduler] Không có lịch hẹn nào cần đánh dấu no_show.");
            return;
        }

        log.info("[Scheduler] Tìm thấy {} lịch hẹn cần đánh dấu no_show.", expired.size());

        for (Appointment apt : expired) {
            // Bước 2: Đổi trạng thái sang no_show
            apt.setStatus(AppointmentStatus.no_show);
            appointmentRepository.save(apt);

            String patientName = apt.getPatientName() != null ? apt.getPatientName() : "Bệnh nhân";

            // Payload đầy đủ để frontend hiển thị thông báo chi tiết
            Map<String, Object> payload = Map.of(
                    "appointmentId", apt.getId(),
                    "status",        "no_show",
                    "patientName",   patientName,
                    "date",          apt.getDate().toString(),
                    "time",          apt.getTime() != null ? apt.getTime() : ""
            );

            // Bước 3: Thông báo realtime cho lễ tân (reload list + hiện chuông)
            try {
                wsHandler.publishToReceptionist("appointment_updated", payload);
            } catch (Exception ignored) {}

            // Bước 4: Thông báo cho bệnh nhân nếu có tài khoản (online booking)
            if (apt.getPatient() != null) {
                try {
                    wsHandler.publishToPatient(apt.getPatient().getId(), "appointment_updated", payload);
                } catch (Exception ignored) {}

                // Lưu DB notification — bệnh nhân thấy trong chuông khi mở app
                try {
                    String dateStr = apt.getDate().format(VN_DATE);
                    String timeStr = apt.getTime() != null ? apt.getTime() : "";
                    notificationService.notifyUser(
                            apt.getPatient().getId(), "appointment",
                            "Lịch khám quá hạn",
                            "Lịch khám ngày " + dateStr + " lúc " + timeStr
                                    + " đã được đánh dấu không đến do bạn không check-in."
                    );
                } catch (Exception ignored) {}
            }

            log.info("[Scheduler] Appointment #{} (bệnh nhân: {}, ngày: {}) → no_show",
                    apt.getId(), patientName, apt.getDate());
        }
    }

    /**
     * Nhóm B — Nhắc lịch khám ngày mai, chạy lúc 20:00 mỗi tối.
     *
     * Tìm tất cả lịch confirmed cho ngày mai có patient (online booking).
     * Walk-in không có tài khoản nên bỏ qua.
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendAppointmentReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<Appointment> tomorrowApts = appointmentRepository.findByDate(tomorrow)
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.confirmed
                          || a.getStatus() == AppointmentStatus.checked_in)
                .filter(a -> a.getPatient() != null)   // chỉ bệnh nhân có tài khoản
                .toList();

        if (tomorrowApts.isEmpty()) {
            log.info("[Scheduler] Không có lịch hẹn nào cần nhắc ngày mai ({}).", tomorrow);
            return;
        }

        log.info("[Scheduler] Gửi nhắc lịch cho {} bệnh nhân ngày mai.", tomorrowApts.size());

        String dateStr = tomorrow.format(VN_DATE);

        for (Appointment apt : tomorrowApts) {
            try {
                String timeStr = apt.getTime() != null ? apt.getTime() : "";
                notificationService.notifyUser(
                        apt.getPatient().getId(), "reminder",
                        "Nhắc lịch khám ngày mai",
                        "Bạn có lịch khám vào lúc " + timeStr + " ngày " + dateStr
                                + " tại VietSkin. Vui lòng đến đúng giờ."
                );

                // Gửi WebSocket để chuông rung ngay nếu bệnh nhân đang online
                wsHandler.publishToPatient(apt.getPatient().getId(), "appointment_updated",
                        Map.of("appointmentId", apt.getId(), "status", "reminder"));

                log.info("[Scheduler] Đã nhắc lịch bệnh nhân #{} ({})", apt.getPatient().getId(), apt.getPatientName());
            } catch (Exception e) {
                log.warn("[Scheduler] Lỗi khi nhắc lịch appointment #{}: {}", apt.getId(), e.getMessage());
            }
        }
    }

    /**
     * Nhóm C — Nhắc tái khám, chạy lúc 20:00 mỗi tối.
     *
     * Tìm các bệnh án có follow_up_date là ngày mai và có bệnh nhân (online booking).
     * Bác sĩ đặt follow_up_date khi tạo/cập nhật bệnh án.
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendFollowUpReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<MedicalRecord> followUps = medicalRecordRepository
                .findByFollowUpDateAndPatientIsNotNull(tomorrow);

        if (followUps.isEmpty()) {
            log.info("[Scheduler] Không có lịch tái khám nào cần nhắc ngày mai ({}).", tomorrow);
            return;
        }

        log.info("[Scheduler] Gửi nhắc tái khám cho {} bệnh nhân ngày mai.", followUps.size());

        String dateStr = tomorrow.format(VN_DATE);

        for (MedicalRecord mr : followUps) {
            try {
                Integer patientId = mr.getPatient().getId();
                notificationService.notifyUser(
                        patientId, "reminder",
                        "Nhắc lịch tái khám ngày mai",
                        "Bạn có lịch tái khám vào ngày " + dateStr
                                + " tại VietSkin. Vui lòng đến đúng hẹn của bác sĩ."
                );

                wsHandler.publishToPatient(patientId, "appointment_updated",
                        Map.of("medicalRecordId", mr.getId(), "status", "follow_up_reminder"));

                log.info("[Scheduler] Đã nhắc tái khám bệnh nhân #{}", patientId);
            } catch (Exception e) {
                log.warn("[Scheduler] Lỗi khi nhắc tái khám bệnh án #{}: {}", mr.getId(), e.getMessage());
            }
        }
    }
}
