package com.vietskin.backend_springboot.modules.prescriptions.mapper;

import com.vietskin.backend_springboot.modules.medicines.entity.Medicine;
import com.vietskin.backend_springboot.modules.prescriptions.dto.PrescriptionResponse;
import com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription;
import com.vietskin.backend_springboot.modules.prescriptions.entity.PrescriptionItem;

import java.util.List;

/**
 * Dựng PrescriptionResponse từ entity Prescription.
 * BẮT BUỘC gọi khi session JPA còn mở (trong @Transactional(readOnly=true) hoặc
 * sau khi entity đã được nạp kèm appointment/items/medicine qua @EntityGraph) để
 * tránh LazyInitializationException khi tắt FORCE_LAZY_LOADING.
 */
public final class PrescriptionMapper {

    private PrescriptionMapper() {}

    public static List<PrescriptionResponse> toList(List<Prescription> entities) {
        return entities.stream().map(PrescriptionMapper::toResponse).toList();
    }

    public static PrescriptionResponse toResponse(Prescription p) {
        if (p == null) return null;
        return new PrescriptionResponse(
                p.getId(),
                p.getNote(),
                p.getCreatedAt(),
                toItems(p.getItems())
        );
    }

    private static List<PrescriptionResponse.ItemResponse> toItems(List<PrescriptionItem> items) {
        if (items == null) return List.of();
        return items.stream().map(PrescriptionMapper::toItem).toList();
    }

    private static PrescriptionResponse.ItemResponse toItem(PrescriptionItem it) {
        return new PrescriptionResponse.ItemResponse(
                it.getId(),
                it.getMedicineName(),
                it.getDosage(),
                it.getFrequency(),
                it.getDuration(),
                it.getQuantity(),
                it.getNote(),
                toMedicine(it.getMedicine())
        );
    }

    private static PrescriptionResponse.Medicine toMedicine(Medicine m) {
        if (m == null) return null;
        return new PrescriptionResponse.Medicine(m.getId(), m.getName());
    }
}
