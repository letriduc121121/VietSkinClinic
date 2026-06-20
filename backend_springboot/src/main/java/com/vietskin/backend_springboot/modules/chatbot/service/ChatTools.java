package com.vietskin.backend_springboot.modules.chatbot.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctors.dto.DoctorSlotsResponse;
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

import java.time.LocalDate;
import java.util.ArrayList;
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

    // Gợi ý lịch trống gần nhất
    private static final int SUGGEST_DAYS = 7;     // quét tối đa 7 ngày tới (giảm từ 14 để nhanh hơn)
    private static final int MAX_SUGGESTIONS = 5;   // số khung giờ gợi ý trả về
    private static final int MAX_DOCTORS_SCAN = 5;  // tối đa 5 bác sĩ để quét (tránh N×7 query)

    // Thông tin cố định của phòng khám (đồng bộ với System Prompt)
    private static final String CLINIC_NAME = "Phòng khám da liễu VietSkin";
    private static final String CLINIC_HOURS = "8:00 – 17:00 (tất cả các ngày trong tuần)";
    private static final String CLINIC_ADDRESS = "175 Tây Sơn";
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

                fn("suggest_appointment_slots",
                        "Gợi ý các KHUNG GIỜ KHÁM TRỐNG GẦN NHẤT để CHỦ ĐỘNG mời khách đặt lịch. "
                                + "Gọi khi khách muốn khám/đặt lịch, vd: 'tôi muốn khám da', 'đặt lịch khám', "
                                + "'có lịch trống không', 'bác sĩ nào còn trống', hoặc khi khách nêu MỐC GIỜ/BUỔI mong muốn "
                                + "('khám lúc 15h', 'khoảng 16h', 'rảnh từ 14h-17h', 'chiều nay', 'sau giờ làm'). "
                                + "Cũng nên gọi sau khi đã tư vấn bác sĩ phù hợp với triệu chứng để mời khách đặt lịch luôn.",
                        Map.of(
                                "doctor", strParam(
                                        "Tùy chọn: tên bác sĩ hoặc chuyên khoa để ưu tiên. Để trống để gợi ý mọi bác sĩ."),
                                "date", strParam(
                                        "Tùy chọn: chỉ xem 1 ngày cụ thể (YYYY-MM-DD). Dùng khi khách nói 'hôm nay'/'chiều nay'/'ngày mai'. Để trống để quét các ngày tới."),
                                "time_from", strParam(
                                        "Tùy chọn: giờ sớm nhất (HH:mm). Map: sáng=08:00, chiều=13:00, 'sau giờ làm'=17:00."),
                                "time_to", strParam(
                                        "Tùy chọn: giờ muộn nhất (HH:mm). Map: sáng=11:40, chiều=16:40."),
                                "preferred_time", strParam(
                                        "Tùy chọn: mốc giờ khách mong muốn (HH:mm), vd 'lúc 15h'->'15:00'. Kết quả sẽ sắp theo độ GẦN mốc này."))),

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
                case "suggest_appointment_slots" -> suggestSlots(
                        args.path("doctor").asText(""),
                        args.path("date").asText(""),
                        args.path("time_from").asText(""),
                        args.path("time_to").asText(""),
                        args.path("preferred_time").asText(""));
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
                        || contains(d.getSpecialty(), kw)
                        || contains(doctorName(d), kw)
                        || contains(d.getDegree(), kw)
                        || contains(d.getDescription(), kw)
                        || parseKeywords(d.getKeywords()).stream().anyMatch(k -> contains(k, kw)))
                .limit(MAX_ROWS)
                .map(this::doctorRow)
                .toList();
        return ToolResult.of(objectMapper, "doctors", Map.of("bac_si", rows, "tong", rows.size()));
    }

    private Map<String, Object> doctorRow(Doctor d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("ten_bac_si", doctorName(d));
        m.put("chuyen_khoa", d.getSpecialty());
        m.put("hoc_vi", d.getDegree());
        m.put("kinh_nghiem", d.getExperience());
        m.put("phi_kham_vnd", d.getConsultationFee());
        m.put("mo_ta", d.getDescription());
        m.put("chuyen_tri", parseKeywords(d.getKeywords()));
        return m;
    }

    /** Đọc cột keywords (JSON array dạng String) thành danh sách bệnh lý điều trị. */
    private List<String> parseKeywords(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    // ── check_availability ─────────────────────────────────────────────────────
    private ToolResult checkAvailability(String doctorKw, String date) {
        if (date == null || date.isBlank()) {
            return ToolResult.error("Thiếu ngày cần xem (định dạng YYYY-MM-DD)");
        }
        String kw = norm(doctorKw);
        Doctor doctor = doctorRepository.findByActiveTrue().stream()
                .filter(d -> kw.isEmpty()
                        || contains(doctorName(d), kw)
                        || contains(d.getSpecialty(), kw)
                        || contains(d.getDegree(), kw)
                        || contains(d.getDescription(), kw)
                        || parseKeywords(d.getKeywords()).stream().anyMatch(k -> contains(k, kw)))
                .findFirst()
                .orElse(null);
        if (doctor == null) {
            return ToolResult.error("Không tìm thấy bác sĩ phù hợp với từ khóa '" + doctorKw + "'");
        }

        DoctorSlotsResponse raw = doctorService.getAvailableSlots(doctor.getId(), date);

        List<Map<String, Object>> slots = raw.slots().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("gio", s.time());
            m.put("trong", s.available());
            return m;
        }).toList();
        long freeCount = raw.slots().stream().filter(DoctorSlotsResponse.Slot::available).count();

        String room = raw.workDay() != null ? raw.workDay().room() : null;

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("bac_si_id", doctor.getId());
        data.put("ten_bac_si", doctorName(doctor));
        data.put("ngay", date);
        data.put("phong", room);
        data.put("co_lich_lam", raw.workDay() != null);
        data.put("so_slot_trong", freeCount);
        data.put("slots", slots);
        return ToolResult.of(objectMapper, "availability", data);
    }

    // ── suggest_appointment_slots ────────────────────────────────────────────
    private ToolResult suggestSlots(String doctorKw, String date, String timeFrom, String timeTo, String preferred) {
        String kw = norm(doctorKw);
        List<Doctor> doctors = doctorRepository.findByActiveTrue().stream()
                .filter(d -> kw.isEmpty()
                        || contains(doctorName(d), kw)
                        || contains(d.getSpecialty(), kw)
                        || contains(d.getDegree(), kw)
                        || contains(d.getDescription(), kw)
                        || parseKeywords(d.getKeywords()).stream().anyMatch(k -> contains(k, kw)))
                .limit(MAX_DOCTORS_SCAN)
                .toList();

        LocalDate today = LocalDate.now();
        int nowMin = java.time.LocalTime.now().getHour() * 60 + java.time.LocalTime.now().getMinute();

        // Khoảng ngày cần quét: 1 ngày cụ thể (khách nói rõ) hoặc các ngày tới.
        List<LocalDate> dates = new ArrayList<>();
        if (date != null && !date.isBlank()) {
            try {
                dates.add(LocalDate.parse(date.trim()));
            } catch (Exception e) {
                return ToolResult.error("Ngày không hợp lệ (cần YYYY-MM-DD)");
            }
        } else {
            for (int i = 0; i < SUGGEST_DAYS; i++) dates.add(today.plusDays(i));
        }

        Integer fromMin = parseMinutes(timeFrom);
        Integer toMin = parseMinutes(timeTo);
        Integer prefMin = parseMinutes(preferred);
        // Có ràng buộc thời gian → liệt kê nhiều khung giờ trong ngày; nếu không → mỗi bác sĩ 1 giờ sớm nhất.
        boolean hasTimePref = fromMin != null || toMin != null || prefMin != null
                || (date != null && !date.isBlank());

        List<Map<String, Object>> all = new ArrayList<>();
        for (LocalDate d : dates) {
            boolean isToday = d.equals(today);
            for (Doctor doc : doctors) {
                DoctorSlotsResponse raw = doctorService.getAvailableSlots(doc.getId(), d.toString());
                if (raw.workDay() == null) continue;
                for (DoctorSlotsResponse.Slot s : raw.slots()) {
                    if (!s.available()) continue;
                    Integer slotMin = parseMinutes(s.time());
                    if (isToday && slotMin != null && slotMin < nowMin) continue;      // bỏ giờ đã qua hôm nay
                    if (fromMin != null && slotMin != null && slotMin < fromMin) continue;
                    if (toMin != null && slotMin != null && slotMin > toMin) continue;
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("bac_si_id", doc.getId());
                    m.put("ten_bac_si", doctorName(doc));
                    m.put("chuyen_khoa", doc.getSpecialty());
                    m.put("ngay", d.toString());
                    m.put("gio", s.time());
                    m.put("phong", raw.workDay().room());
                    m.put("phi_kham_vnd", doc.getConsultationFee());
                    all.add(m);
                    if (!hasTimePref) break; // mỗi (bác sĩ, ngày) chỉ lấy giờ sớm nhất để gợi ý đa dạng
                }
            }
            // Slot ngày sớm hơn luôn xếp trước → đủ gợi ý thì dừng quét các ngày sau.
            if (all.size() >= MAX_SUGGESTIONS) break;
        }

        // Sắp xếp: ngày gần nhất trước; cùng ngày thì ưu tiên gần mốc giờ mong muốn (nếu có), không thì theo giờ tăng dần.
        Comparator<Map<String, Object>> byDate = Comparator.comparing(m -> (String) m.get("ngay"));
        Comparator<Map<String, Object>> cmp = prefMin != null
                ? byDate.thenComparingInt(m -> {
                    Integer min = parseMinutes((String) m.get("gio"));
                    return min == null ? Integer.MAX_VALUE : Math.abs(min - prefMin);
                })
                : byDate.thenComparing(m -> (String) m.get("gio"));

        List<Map<String, Object>> suggestions = all.stream().sorted(cmp).limit(MAX_SUGGESTIONS).toList();

        return ToolResult.of(objectMapper, "slot_suggestions",
                Map.of("goi_y", suggestions, "tong", suggestions.size()));
    }

    /** Đổi "HH:mm" → số phút từ 0h. Trả null nếu rỗng/sai định dạng. */
    private static Integer parseMinutes(String hhmm) {
        if (hhmm == null) return null;
        String t = hhmm.trim();
        int idx = t.indexOf(':');
        if (idx <= 0) return null;
        try {
            int h = Integer.parseInt(t.substring(0, idx));
            int m = Integer.parseInt(t.substring(idx + 1));
            if (h < 0 || h > 23 || m < 0 || m > 59) return null;
            return h * 60 + m;
        } catch (Exception e) {
            return null;
        }
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
