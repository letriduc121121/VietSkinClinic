package com.vietskin.backend_springboot.modules.medical_record_images.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.utils.SecurityUtils;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.medical_record_images.entity.MedicalRecordImage;
import com.vietskin.backend_springboot.modules.medical_record_images.repository.MedicalRecordImageRepository;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MedicalRecordImageService {

    private final MedicalRecordImageRepository imageRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;
    private final Cloudinary cloudinary;

    public MedicalRecordImage upload(MultipartFile file, Integer medicalRecordId,
                                     String note, Integer doctorUserId) throws IOException {
        // Kiểm tra bệnh án thuộc đúng bác sĩ
        var doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Không tìm thấy bác sĩ"));

        MedicalRecord record = medicalRecordRepository.findById(medicalRecordId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bệnh án không tồn tại"));

        if (!record.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Không có quyền truy cập bệnh án này");
        }

        // Upload lên Cloudinary
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "vietskin/medical-records/" + medicalRecordId,
                "transformation", new Transformation()
                        .width(1920).height(1920).crop("limit")
                        .chain()
                        .quality("auto").fetchFormat("webp")
        ));

        MedicalRecordImage image = new MedicalRecordImage();
        image.setImageUrl((String) result.get("secure_url"));
        image.setPublicId((String) result.get("public_id"));
        image.setNote(note);
        image.setMedicalRecord(record);

        return imageRepository.save(image);
    }

    public List<MedicalRecordImage> findByMedicalRecord(Integer medicalRecordId) {
        // Bệnh nhân chỉ được xem ảnh thuộc bệnh án của chính mình (chống IDOR)
        MedicalRecord record = medicalRecordRepository.findById(medicalRecordId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bệnh án không tồn tại"));
        SecurityUtils.requireSelfIfPatient(record.getPatient() != null ? record.getPatient().getId() : null);
        return imageRepository.findByMedicalRecordIdOrderByCreatedAtAsc(medicalRecordId);
    }

    public void delete(Integer id, Integer doctorUserId) throws Exception {
        var doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Không tìm thấy bác sĩ"));

        MedicalRecordImage image = imageRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh"));

        if (!image.getMedicalRecord().getDoctor().getId().equals(doctor.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Không có quyền xóa ảnh này");
        }

        // Xóa trên Cloudinary
        cloudinary.uploader().destroy(image.getPublicId(), Map.of());
        imageRepository.deleteById(id);
    }
}
