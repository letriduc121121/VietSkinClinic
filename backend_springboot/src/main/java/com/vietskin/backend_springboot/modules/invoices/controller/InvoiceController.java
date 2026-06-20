package com.vietskin.backend_springboot.modules.invoices.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.invoices.dto.CreateInvoiceRequest;
import com.vietskin.backend_springboot.modules.invoices.dto.InvoiceResponse;
import com.vietskin.backend_springboot.modules.invoices.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // Lễ tân / Admin tạo hóa đơn (thu tiền ngay)
    @PostMapping
    @PreAuthorize("hasAnyRole('receptionist','admin')")
    public ApiResponse<InvoiceResponse> create(
            @Valid @RequestBody CreateInvoiceRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer receivedByUserId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(invoiceService.create(req, receivedByUserId));
    }

    // Admin / Lễ tân xem tất cả, lọc theo status
    @GetMapping
    @PreAuthorize("hasAnyRole('admin','receptionist')")
    public ApiResponse<List<InvoiceResponse>> findAll(
            @RequestParam(required = false) String status) {
        return ApiResponse.ok(invoiceService.findAll(status));
    }

    // Bệnh nhân xem hóa đơn của mình
    @GetMapping("/my")
    @PreAuthorize("hasRole('patient')")
    public ApiResponse<List<InvoiceResponse>> myInvoices(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer patientId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(invoiceService.findByPatient(patientId));
    }

    // Admin xem thống kê doanh thu
    @GetMapping("/stats")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> getStats() {
        return ApiResponse.ok(invoiceService.getStats());
    }

    // Chi tiết hóa đơn
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin','receptionist','patient')")
    public ApiResponse<InvoiceResponse> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(invoiceService.findOne(id));
    }
}
