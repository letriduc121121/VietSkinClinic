package com.vietskin.backend_springboot.modules.invoices.mapper;

import com.vietskin.backend_springboot.modules.invoices.dto.InvoiceFlat;
import com.vietskin.backend_springboot.modules.invoices.dto.InvoiceResponse;

import java.util.List;

/**
 * Dựng InvoiceResponse (lồng nhau) từ projection phẳng InvoiceFlat.
 * Vì nguồn là projection nên không có entity LAZY nào bị động vào → không N+1.
 */
public final class InvoiceMapper {

    private InvoiceMapper() {}

    public static List<InvoiceResponse> toList(List<InvoiceFlat> rows) {
        return rows.stream().map(InvoiceMapper::toResponse).toList();
    }

    public static InvoiceResponse toResponse(InvoiceFlat f) {
        if (f == null) return null;
        return new InvoiceResponse(
                f.id(),
                f.invoiceCode(),
                f.patientName(),
                f.description(),
                f.amount(),
                f.status() != null ? f.status().name() : null,
                f.method() != null ? f.method().name() : null,
                f.paidAt(),
                f.note(),
                f.createdAt(),
                f.updatedAt(),
                toPatient(f),
                toReceivedBy(f)
        );
    }

    private static InvoiceResponse.Patient toPatient(InvoiceFlat f) {
        if (f.patientId() == null) return null;
        return new InvoiceResponse.Patient(f.patientId(), f.patientUserName(), f.patientUserPhone());
    }

    private static InvoiceResponse.ReceivedBy toReceivedBy(InvoiceFlat f) {
        if (f.receivedById() == null) return null;
        return new InvoiceResponse.ReceivedBy(f.receivedById(), f.receivedByName());
    }
}
