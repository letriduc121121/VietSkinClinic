package com.vietskin.backend_springboot.modules.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.doctors.service.DoctorService;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.specialties.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "Công cụ" (tools) cho phép AI truy vấn DỮ LIỆU THẬT của phòng khám.
 * AI tự quyết định khi nào gọi (Tool Calling). Tất cả tool chỉ ĐỌC (read-only).
 *
 * Mỗi tool trả về {@link ToolResult}:
 *   - forModel: JSON đưa lại cho AI để nó viết câu dẫn.
 *   - cardType: loại CARD để frontend render đẹp (null = không vẽ card, vd lỗi).
 *   - cardData: dữ liệu gắn vào card.
 */
@Component
@RequiredArgsConstructor
public class ChatTools {

    private final ServiceRepository serviceRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorService doctorService;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;

    private static final int MAX_ROWS = 15;

    // Thông tin cố định của phòng khám (đồng bộ với System Prompt)
    private static final String CLINIC_NAME = "Phòng khám da liễu VietSkin";
    private static final String CLINIC_HOURS = "8:00 – 20:00 (tất cả các ngày trong tuần)";
    private static final String CLINIC_ADDRESS = "123 Đường Da Liễu, Quận 1, TP.HCM";
    private static final String CLINIC_HOTLINE = "1900 1234";

    /** Kết quả thực thi 1 tool. */
    public record ToolResult(String forModel, String cardType, Object cardData) {
        static ToolResult of(ObjectMapper om, String cardType, Object data) {
            try {
                return new ToolResult(om.writeValueAsString(data), cardType, data);
            } catch (Exception e) {
                return error("Không tạo được dữ liệu");
            }
        }
        static ToolResult error(String message) {
            return new ToolResult("{\"error\":\"" + message + "\"}", null, null);
        }
    }

    /** Khai báo tool theo chuẩn OpenAI để gửi cho Groq. */
    public List<Map<String, Object>> definitions() {
        return List.of(
                fn("search_services",
                        "Tra cứu danh mục dịch vụ da liễu của VietSkin kèm GIÁ và thời gian thực hiện. "
                                + "Gọi khi khách hỏi về dịch vụ, bảng giá, chi phí, giá tiền.",
                        Map.of("keyword", strParam(
                                "Từ khóa tên/loại dịch vụ (vd: 'mụn','laser','nám'). Để trống để lấy tất cả."))),

                fn("list_doctors",
                        "Tra cứu danh sách bác sĩ da liễu kèm chuyên khoa, học vị và PHÍ KHÁM. "
                                + "Gọi khi khách hỏi về bác sĩ, chuyên khoa hoặc phí khám.",
                        Map.of("keyword", strParam(
                                "Từ khóa tên bác sĩ hoặc chuyên khoa. Để trống để lấy tất cả."))),

                fn("check_availability",
                        "Tra cứu các KHUNG GIỜ còn trống của một bác sĩ trong một ngày cụ thể để tư vấn đặt lịch. "
                                + "Gọi khi khách hỏi 'bác sĩ X ngày Y còn trống giờ nào', 'còn lịch không'.",
                        Map.of(
                                "doctor", strParam("Tên bác sĩ hoặc chuyên khoa (vd: 'Nguyễn Văn A', 'da liễu')."),
                                "date", strParam("Ngày cần xem ở định dạng YYYY-MM-DD. Tự suy ra từ 'hôm nay'/'ngày mai' dựa trên ngày hiện tại đã cho."))),

                fn("get_clinic_info",
                        "Lấy thông tin chung của phòng khám: giờ làm việc, địa chỉ, hotline, chuyên khoa, phương thức thanh toán. "
                                + "Gọi khi khách hỏi về giờ mở cửa, địa chỉ, liên hệ, cách thanh toán.",
                        Map.of()),

                fn("get_my_appointments",
                        "Tra cứu LỊCH HẸN của chính người dùng đang đăng nhập (trạng thái, ngày giờ, bác sĩ, số thứ tự). "
                                + "Gọi khi khách hỏi 'lịch hẹn của tôi', 'tôi đặt lịch chưa', 'lịch của tôi thế nào'.",
                        Map.of()),

                fn("get_my_invoices",
                        "Tra cứu HÓA ĐƠN của chính người dùng đang đăng nhập (số tiền, đã/chưa thanh toán). "
                                + "Gọi khi khách hỏi 'hóa đơn của tôi', 'tôi đã thanh toán chưa', 'còn nợ tiền không'.",
                        Map.of())
        );
    }

    /** Thực thi 1 tool theo tên + tham số (JSON string). userId có thể null (khách chưa đăng nhập). */
    @Transactional(readOnly = true)
    public ToolResult execute(String name, String argumentsJson, Integer userId) {
        try {
            JsonNode args = (argumentsJson != null && !argumentsJson.isBlank())
                    ? objectMapper.readTree(argumentsJson)
                    : objectMapper.createObjectNode();
            String keyword = args.path("keyword").asText("");
            return switch (name) {
                case "search_services"     -> searchServices(keyword);
                case "list_doctors"        -> listDoctors(keyword);
                case "check_availability"  -> checkAvailability(args.path("doctor").asText(""), args.path("date").asText(""));
                case "get_clinic_info"     -> clinicInfo();
                case "get_my_appointments" -> myAppointments(userId);
                case "get_my_invoices"     -> myInvoices(userId);
                default -> ToolResult.error("unknown tool");
            };
        } catch (Exception e) {
            return ToolResult.error("Không truy vấn được dữ liệu");
        }
    }

    // ── search_services ──────────────────────────────────────────────────────
    private ToolResult searchServices(String keyword) {
        String kw = norm(keyword);
        List<Map<String, Object>> rows = serviceRepository.findByActiveTrue().stream()
                .filter(s -> kw.isEmpty()
                        || contains(s.getName(), kw) || contains(s.getCategory(), kw))
                .limit(MAX_ROWS)
                .map(this::serviceRow)
                .toList();
        return ToolResult.of(objectMapper, "services", Map.of("dich_vu", rows, "tong", rows.size()));
    }

    private Map<String, Object> serviceRow(Service s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ten_dich_vu", s.getName());
        m.put("gia_vnd", s.getPrice());
        m.put("thoi_gian_phut", s.getDuration());
        m.put("mo_ta", s.getDescription());
        return m;
    }

    // ── list_doctors ─────────────────────────────────────────────────────────
    private ToolResult listDoctors(String keyword) {
        String kw = norm(keyword);
        List<Map<String, Object>> rows = doctorRepository.findByActiveTrue().stream()
                .filter(d -> kw.isEmpty()
                        || contains(d.getSpecialty(), kw) || contains(doctorName(d), kw))
                .limit(MAX_ROWS)
                .map(this::doctorRow)
                .toList();
        return ToolResult.of(objectMapper, "doctors", Map.of("bac_si", rows, "tong", rows.size()));
    }

    private Map<String, Object> doctorRow(Doctor d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ten_bac_si", doctorName(d));
        m.put("chuyen_khoa", d.getSpecialty());
        m.put("hoc_vi", d.getDegree());
        m.put("kinh_nghiem", d.getExperience());
        m.put("phi_kham_vnd", d.getConsultationFee());
        return m;
    }

    // ── check_availability ─────────────────────────────────────────────────────
    private ToolResult checkAvailability(String doctorKw, String date) {
        if (date == null || date.isBlank()) {
            return ToolResult.error("Thiếu ngày cần xem (định dạng YYYY-MM-DD)");
        }
        String kw = norm(doctorKw);
        Doctor doctor = doctorRepository.findByActiveTrue().stream()
                .filter(d -> kw.isEmpty()
                        || contains(doctorName(d), kw) || contains(d.getSpecialty(), kw))
                .findFirst()
                .orElse(null);
        if (doctor == null) {
            return ToolResult.error("Không tìm thấy bác sĩ phù hợp với từ khóa '" + doctorKw + "'");
        }

        Map<String, Object> raw = doctorService.getAvailableSlots(doctor.getId(), date);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawSlots = (List<Map<String, Object>>) raw.getOrDefault("slots", List.of());

        List<Map<String, Object>> slots = rawSlots.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("gio", s.get("time"));
            m.put("trong", s.get("available"));
            return m;
        }).toList();
        long freeCount = slots.stream().filter(s -> Boolean.TRUE.equals(s.get("trong"))).count();

        Object workDay = raw.get("workDay");
        String room = (workDay instanceof Map<?, ?> w) ? String.valueOf(w.get("room")) : null;

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ten_bac_si", doctorName(doctor));
        data.put("ngay", date);
        data.put("phong", room);
        data.put("co_lich_lam", workDay != null);
        data.put("so_slot_trong", freeCount);
        data.put("slots", slots);
        return ToolResult.of(objectMapper, "availability", data);
    }

    // ── get_clinic_info ──────────────────────────────────────────────────────
    private ToolResult clinicInfo() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ten", CLINIC_NAME);
        data.put("gio_lam_viec", CLINIC_HOURS);
        data.put("dia_chi", CLINIC_ADDRESS);
        data.put("hotline", CLINIC_HOTLINE);
        data.put("chuyen_khoa", "Da liễu (điều trị mụn, nám, tàn nhang, chăm sóc & trẻ hóa da)");
        data.put("thanh_toan", List.of("Tiền mặt", "Chuyển khoản", "Quẹt thẻ", "Mã QR"));
        return ToolResult.of(objectMapper, "clinic", data);
    }

    // ── get_my_appointments ──────────────────────────────────────────────────
    private ToolResult myAppointments(Integer userId) {
        if (userId == null) {
            return ToolResult.error("Người dùng chưa đăng nhập — hãy hướng dẫn họ đăng nhập để xem lịch hẹn cá nhân.");
        }
        List<Map<String, Object>> rows = appointmentRepository.findByPatientId(userId).stream()
                .sorted(Comparator.comparing(Appointment::getDate).reversed())
                .limit(MAX_ROWS)
                .map(this::appointmentRow)
                .toList();
        return ToolResult.of(objectMapper, "appointments", Map.of("lich_hen", rows, "tong", rows.size()));
    }

    private Map<String, Object> appointmentRow(Appointment a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("ngay", a.getDate() != null ? a.getDate().toString() : null);
        m.put("gio", a.getTime());
        m.put("bac_si", a.getDoctor() != null ? doctorName(a.getDoctor()) : null);
        m.put("dich_vu", a.getService() != null ? a.getService().getName() : null);
        m.put("trang_thai", a.getStatus() != null ? a.getStatus().name() : null);
        m.put("so_thu_tu", a.getQueueNumber());
        return m;
    }

    // ── get_my_invoices ──────────────────────────────────────────────────────
    private ToolResult myInvoices(Integer userId) {
        if (userId == null) {
            return ToolResult.error("Người dùng chưa đăng nhập — hãy hướng dẫn họ đăng nhập để xem hóa đơn cá nhân.");
        }
        List<Map<String, Object>> rows = invoiceRepository.findByPatientId(userId).stream()
                .sorted(Comparator.comparing(Invoice::getId).reversed())
                .limit(MAX_ROWS)
                .map(this::invoiceRow)
                .toList();
        return ToolResult.of(objectMapper, "invoices", Map.of("hoa_don", rows, "tong", rows.size()));
    }

    private Map<String, Object> invoiceRow(Invoice inv) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ma", inv.getInvoiceCode());
        m.put("mo_ta", inv.getDescription());
        m.put("so_tien_vnd", inv.getAmount());
        m.put("trang_thai", inv.getStatus() != null ? inv.getStatus().name() : null);
        m.put("phuong_thuc", inv.getMethod() != null ? inv.getMethod().name() : null);
        m.put("ngay", inv.getCreatedAt() != null ? inv.getCreatedAt().toLocalDate().toString() : null);
        return m;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    private static boolean contains(String value, String kw) {
        return value != null && value.toLowerCase().contains(kw);
    }

    private static String doctorName(Doctor d) {
        return (d.getUser() != null && d.getUser().getName() != null) ? d.getUser().getName() : "";
    }

    /** Dựng 1 khai báo function-tool chuẩn OpenAI. properties rỗng = tool không tham số. */
    private static Map<String, Object> fn(String name, String description, Map<String, Object> properties) {
        return Map.of(
                "type", "function",
                "function", Map.of(
                        "name", name,
                        "description", description,
                        "parameters", Map.of(
                                "type", "object",
                                "properties", properties
                        )
                )
        );
    }

    private static Map<String, Object> strParam(String description) {
        return Map.of("type", "string", "description", description);
    }
}
