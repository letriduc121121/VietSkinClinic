package com.vietskin.backend_springboot.modules.medical_records.mapper;

import com.vietskin.backend_springboot.modules.medical_record_images.entity.MedicalRecordImage;
import com.vietskin.backend_springboot.modules.medical_records.dto.MedicalRecordResponse;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.prescriptions.entity.PrescriptionItem;

import java.util.List;

/**
 * Dựng MedicalRecordResponse từ entity MedicalRecord.
 * BẮT BUỘC gọi trong @Transactional(readOnly=true): mapper có chạm vào các quan hệ
 * (appointment/doctor/images/prescriptions) nên cần session còn mở để init LAZY.
 */
public final class MedicalRecordMapper {

    private MedicalRecordMapper() {}

    public static List<MedicalRecordResponse> toList(List<MedicalRecord> records) {
        return records.stream().map(MedicalRecordMapper::toResponse).toList();
    }

    public static MedicalRecordResponse toResponse(MedicalRecord m) {
        if (m == null) return null;
        return new MedicalRecordResponse(
                m.getId(),
                m.getSymptoms(),
                m.getSkinType(),
                m.getLesionLocation(),
                m.getDiagnosis(),
                m.getTreatment(),
                m.getNote(),
                m.getFollowUpDate(),
                m.getCreatedAt(),
                m.getUpdatedAt(),
                toAppointment(m),
                toDoctor(m),
                toPrescriptions(m),
                toImages(m)
        );
    }

    private static MedicalRecordResponse.Appointment toAppointment(MedicalRecord m) {
        var apt = m.getAppointment();
        if (apt == null) return null;
        MedicalRecordResponse.Service service = apt.getService() != null
                ? new MedicalRecordResponse.Service(apt.getService().getName())
                : null;
        return new MedicalRecordResponse.Appointment(
                apt.getId(), apt.getDate(), apt.getTime(), apt.getPatientName(), service);
    }

    private static MedicalRecordResponse.Doctor toDoctor(MedicalRecord m) {
        var doctor = m.getDoctor();
        if (doctor == null || doctor.getUser() == null) return null;
        return new MedicalRecordResponse.Doctor(
                new MedicalRecordResponse.User(doctor.getUser().getName(), doctor.getUser().getAvatar()));
    }

    private static List<MedicalRecordResponse.Prescription> toPrescriptions(MedicalRecord m) {
        if (m.getPrescriptions() == null) return List.of();
        return m.getPrescriptions().stream()
                .map(p -> new MedicalRecordResponse.Prescription(
                        p.getId(),
                        p.getNote(),
                        p.getCreatedAt(),
                        toItems(p.getItems())))
                .toList();
    }

    private static List<MedicalRecordResponse.Item> toItems(List<PrescriptionItem> items) {
        if (items == null) return List.of();
        return items.stream()
                .map(it -> new MedicalRecordResponse.Item(
                        it.getId(),
                        it.getMedicineName(),
                        it.getDosage(),
                        it.getFrequency(),
                        it.getDuration(),
                        it.getQuantity(),
                        it.getNote()))
                .toList();
    }

    private static List<MedicalRecordResponse.Image> toImages(MedicalRecord m) {
        if (m.getImages() == null) return List.of();
        // medicalRecordId lấy thẳng từ record cha (tránh chạm proxy LAZY của ảnh)
        return m.getImages().stream()
                .map(img -> toImage(img, m.getId()))
                .toList();
    }

    private static MedicalRecordResponse.Image toImage(MedicalRecordImage img, Integer medicalRecordId) {
        return new MedicalRecordResponse.Image(
                img.getId(),
                medicalRecordId,
                img.getImageUrl(),
                img.getPublicId(),
                img.getNote(),
                img.getCreatedAt());
    }
}
