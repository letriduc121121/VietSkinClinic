package com.vietskin.backend_springboot.modules.prescriptions.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.utils.SecurityUtils;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import com.vietskin.backend_springboot.modules.medicines.repository.MedicineRepository;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import com.vietskin.backend_springboot.modules.prescriptions.dto.CreatePrescriptionRequest;
import com.vietskin.backend_springboot.modules.prescriptions.dto.PrescriptionItemRequest;
import com.vietskin.backend_springboot.modules.prescriptions.dto.PrescriptionResponse;
import com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription;
import com.vietskin.backend_springboot.modules.prescriptions.entity.PrescriptionItem;
import com.vietskin.backend_springboot.modules.prescriptions.mapper.PrescriptionMapper;
import com.vietskin.backend_springboot.modules.prescriptions.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final NotificationService notificationService;
    private final AppWebSocketHandler wsHandler;

    @Transactional
    public PrescriptionResponse create(CreatePrescriptionRequest req, Integer doctorUserId) {
        Appointment apt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Lịch hẹn không tồn tại"));

        Doctor doctor = doctorRepository.findByUserId(doctorUserId).orElse(null);

        // Bác sĩ chỉ được kê đơn cho lịch khám do chính mình phụ trách (chống kê đơn hộ bác sĩ khác)
        Doctor aptDoctor = apt.getDoctor();
        if (doctor == null || aptDoctor == null || !aptDoctor.getId().equals(doctor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền kê đơn cho lịch khám của bác sĩ khác");
        }

        Prescription prescription = new Prescription();
        prescription.setAppointment(apt);
        prescription.setNote(req.getNote());
        // Bệnh nhân & bác sĩ truy qua appointment (đã chuẩn hóa, không lưu trùng tại prescription).
        // Biến `doctor` vẫn dùng để lấy tên gửi thông báo bên dưới.

        if (req.getMedicalRecordId() != null) {
            MedicalRecord mr = medicalRecordRepository.findById(req.getMedicalRecordId()).orElse(null);
            prescription.setMedicalRecord(mr);
        }

        List<PrescriptionItem> items = new ArrayList<>();
        for (PrescriptionItemRequest itemReq : req.getItems()) {
            PrescriptionItem item = new PrescriptionItem();
            item.setMedicineName(itemReq.getMedicineName());
            item.setDosage(itemReq.getDosage());
            item.setFrequency(itemReq.getFrequency());
            item.setDuration(itemReq.getDuration());
            item.setQuantity(itemReq.getQuantity());
            item.setNote(itemReq.getNote());
            item.setPrescription(prescription);

            if (itemReq.getMedicineId() != null) {
                medicineRepository.findById(itemReq.getMedicineId())
                        .ifPresent(m -> {
                            item.setMedicine(m);
                            if (item.getMedicineName() == null || item.getMedicineName().isBlank()) {
                                item.setMedicineName(m.getName());
                            }
                        });
            }

            if (item.getMedicineName() == null || item.getMedicineName().isBlank()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Mỗi thuốc phải có tên hoặc mã thuốc hợp lệ");
            }
            items.add(item);
        }
        prescription.setItems(items);

        Prescription saved = prescriptionRepository.save(prescription);

        // Thông báo cho bệnh nhân khi bác sĩ kê đơn thuốc (chỉ online booking có tài khoản)
        if (apt.getPatient() != null) {
            try {
                String doctorName = (doctor != null && doctor.getUser() != null)
                        ? doctor.getUser().getName() : "Bác sĩ";
                int itemCount = req.getItems().size();

                notificationService.notifyUser(
                        apt.getPatient().getId(), "prescription",
                        "Đơn thuốc mới",
                        doctorName + " vừa kê " + itemCount + " loại thuốc cho bạn. "
                                + "Vui lòng nhận đơn tại quầy sau khi thanh toán."
                );

                // Ping WebSocket để chuông reload ngay nếu bệnh nhân đang online
                wsHandler.publishToPatient(apt.getPatient().getId(), "appointment_updated",
                        Map.of("appointmentId", apt.getId(), "status", "prescription_created"));
            } catch (Exception ignored) {}
        }

        // Nạp lại kèm quan hệ (items/medicine) để map DTO an toàn rồi trả về
        return prescriptionRepository.findWithDetailsById(saved.getId())
                .map(PrescriptionMapper::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse findOne(Integer id) {
        Prescription p = prescriptionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Đơn thuốc không tồn tại"));
        // Bệnh nhân chỉ được xem đơn thuốc của chính mình (chống IDOR)
        Appointment apt = p.getAppointment();
        SecurityUtils.requireSelfIfPatient(
                apt != null && apt.getPatient() != null ? apt.getPatient().getId() : null);
        return PrescriptionMapper.toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> findByAppointment(Integer appointmentId) {
        return prescriptionRepository.findWithDetailsByAppointmentId(appointmentId)
                .map(p -> List.of(PrescriptionMapper.toResponse(p)))
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> findByMedicalRecord(Integer medicalRecordId) {
        List<Prescription> list = prescriptionRepository.findWithDetailsByMedicalRecordId(medicalRecordId);
        // Bệnh nhân chỉ được xem đơn thuốc của chính mình (chống IDOR khi đổi medicalRecordId trên URL)
        if (!list.isEmpty()) {
            Appointment apt = list.get(0).getAppointment();
            SecurityUtils.requireSelfIfPatient(
                    apt != null && apt.getPatient() != null ? apt.getPatient().getId() : null);
        }
        return PrescriptionMapper.toList(list);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> findByPatient(Integer patientId) {
        List<Prescription> list = prescriptionRepository
                .findWithDetailsByAppointment_Patient_Id(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
        return PrescriptionMapper.toList(list);
    }

    @Transactional
    public void delete(Integer id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Đơn thuốc không tồn tại"));

        // Bác sĩ chỉ được xóa đơn thuốc của lịch khám mình phụ trách
        Doctor current = doctorRepository.findByUserId(SecurityUtils.currentUserId()).orElse(null);
        Doctor aptDoctor = p.getAppointment() != null ? p.getAppointment().getDoctor() : null;
        if (current == null || aptDoctor == null || !aptDoctor.getId().equals(current.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa đơn thuốc của bác sĩ khác");
        }

        prescriptionRepository.delete(p);
    }
}
