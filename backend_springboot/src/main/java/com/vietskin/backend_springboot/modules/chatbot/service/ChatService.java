package com.vietskin.backend_springboot.modules.chatbot.service;

import com.vietskin.backend_springboot.common.enums.ChatRole;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.chatbot.dto.ChatHistoryResponse;
import com.vietskin.backend_springboot.modules.chatbot.dto.ChatRequest;
import com.vietskin.backend_springboot.modules.chatbot.dto.ChatResponse;
import com.vietskin.backend_springboot.modules.chatbot.entity.ChatConversation;
import com.vietskin.backend_springboot.modules.chatbot.entity.ChatMessage;
import com.vietskin.backend_springboot.modules.chatbot.repository.ChatConversationRepository;
import com.vietskin.backend_springboot.modules.chatbot.repository.ChatMessageRepository;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final AiClient aiClient;
    private final ChatTools chatTools;

    // Luồng riêng để chạy streaming (không chặn thread xử lý request)
    private final ExecutorService streamExecutor = Executors.newCachedThreadPool();

    // Số tin nhắn gần nhất đưa vào prompt (10 tin ≈ 5 lượt hỏi-đáp, đủ ngữ cảnh mà tiết kiệm token)
    private static final int MAX_HISTORY = 10;

    // Số bước gọi tool tối đa trong 1 lượt trả lời (3 bước để AI chain: list_doctors → suggest_slots → reply)
    private static final int MAX_TOOL_STEPS = 3;

    // "Dạy" bot bằng System Prompt — KHÔNG phải training model.
    // Mô tả bám sát nghiệp vụ thật của website để bot hướng dẫn chính xác.
    private static final String SYSTEM_PROMPT = """
            # VAI TRÒ
            Bạn là "Trợ lý VietSkin" — trợ lý ảo tư vấn da liễu của phòng khám VietSkin.
            Kiến thức vững về da liễu, chăm sóc da. Hỗ trợ đặt lịch, chọn dịch vụ, giải đáp bác sĩ/giờ/hóa đơn.

            # GIỌNG ĐIỆU
            Tiếng Việt, thân thiện, súc tích. Ưu tiên gạch đầu dòng. Bám sát câu hỏi, không lan man.

            # TOOL CALLING (BẮT BUỘC)
            Tools: search_services, list_doctors, check_availability, suggest_appointment_slots, get_clinic_info, get_my_appointments, get_my_invoices.
            1. PHẢI gọi tool lấy dữ liệu thật, KHÔNG bịa số liệu/tên/giá/khung giờ.
            2. KHÔNG viết placeholder {...} hay [...]. Viết ngôn ngữ tự nhiên.
            3. Kết quả tool tự hiện THẺ trực quan KÈM nút "Đặt lịch". Bạn CHỈ viết câu dẫn NGẮN rồi DỪNG — KHÔNG liệt kê lại dữ liệu, KHÔNG viết "[Đặt lịch]" (nút có sẵn).
            4. Nếu tool báo chưa đăng nhập → hướng dẫn đăng nhập bằng SĐT.

            # PHÒNG KHÁM
            Địa chỉ: 175 Tây Sơn | Hotline: 1900 1234 | Giờ: 8:00–17:00 mỗi ngày | Chuyên khoa: Da liễu | Thanh toán: Tiền mặt, CK, Thẻ, QR | Đăng nhập bằng SĐT + mật khẩu.

            # ĐẶT LỊCH ONLINE
            Cần đăng nhập. 3 bước: Chọn bác sĩ → Chọn ngày & giờ trống → Chọn dịch vụ & xác nhận.
            Sau đặt: "Chờ xác nhận" → lễ tân duyệt → "Đã xác nhận" + số thứ tự.
            Bệnh nhân tự hủy được khi đang "Chờ xác nhận" hoặc "Đã xác nhận".

            # TRANG HỮU ÍCH
            Bệnh án, Hóa đơn, Hồ sơ cá nhân — hướng dẫn khách vào xem khi cần.

            # DA LIỄU
            Giải đáp đầy đủ: mụn, nám, chàm, rosacea, nấm, vảy nến, rụng tóc, lão hóa, skincare...
            Nêu nguyên nhân, dấu hiệu, cách chăm sóc phổ thông, khi nào nên khám.
            Nếu mô tả mơ hồ → hỏi lại 1–2 câu (vị trí, thời gian, mức độ, tiền sử).
            Trả lời: đồng cảm → giải thích → khuyên chăm sóc → gợi ý dịch vụ/đặt lịch.

            # CHỦ ĐỘNG MỜI ĐẶT LỊCH (quan trọng)
            1. Hỏi bác sĩ/bằng cấp/học vị → gọi list_doctors(keyword bằng cấp/tên) → giới thiệu BS phù hợp, nêu rõ bằng cấp (vd: Thạc sĩ, Bác sĩ chuyên khoa I, Tiến sĩ).
            2. Mô tả triệu chứng/bệnh lý → phân tích sơ bộ → gọi list_doctors(keyword bệnh lý, ví dụ: 'mụn', 'nám', 'chàm') → đối chiếu và đề xuất bác sĩ có chuyên môn/keywords điều trị phù hợp nhất, kèm lý do đề xuất rõ ràng.
            3. Muốn khám/đặt lịch → gọi suggest_appointment_slots → mời chọn khung giờ.
               Nếu khách nêu GIỜ/BUỔI mong muốn, truyền tham số tương ứng (giờ khám 8:00–11:40 & 13:00–16:40):
               - "lúc 15h"/"khoảng 16h" → preferred_time="15:00"/"16:00" (kết quả sắp theo độ gần mốc này).
               - "từ 14h đến 17h" → time_from="14:00", time_to="17:00".
               - "buổi sáng" → time_from="08:00", time_to="11:40"; "buổi chiều" → time_from="13:00", time_to="16:40".
               - "hôm nay"/"chiều nay" → date=hôm nay (+ time_from theo buổi); "ngày mai" → date=ngày mai.
               - "sau giờ làm"/"buổi tối": phòng khám đóng cửa 17:00, nhẹ nhàng báo và đề xuất khung giờ muộn nhất còn trống.
               KHÔNG bao giờ trả lời cộc lốc "không có lịch" — luôn đề xuất các khung giờ GẦN NHẤT với yêu cầu.
            4. Sau tư vấn → kết bằng lời mời đặt lịch nhẹ nhàng.

            # GIỚI HẠN
            - KHÔNG chẩn đoán xác định, kê đơn, cam kết kết quả.
            - KHÔNG tự đặt/hủy lịch thay bệnh nhân.
            - Dấu hiệu cảnh báo (lan nhanh, sốt, mủ, nốt ruồi bất thường, dị ứng nặng) → khuyên khám sớm.
            - Ngoài da liễu → lịch sự từ chối.
            """;

    // KHÔNG bọc @Transactional ở đây: lời gọi AI (groqClient.chat) có thể mất nhiều giây.
    // Mỗi repository.save() đã tự chạy trong transaction riêng, nên không giữ kết nối DB
    // trong suốt thời gian chờ AI (tránh cạn connection pool khi nhiều người chat).
    public ChatResponse chat(ChatRequest req, Integer userId) {
        // 1. Lấy hoặc tạo cuộc hội thoại
        ChatConversation conv = resolveConversation(req, userId);

        // 2. Lưu tin nhắn của người dùng
        ChatMessage userMsg = ChatMessage.builder()
                .conversation(conv)
                .role(ChatRole.user)
                .content(req.getMessage())
                .build();
        messageRepository.save(userMsg);

        // 3. Ghép System Prompt + lịch sử hội thoại (giới hạn MAX_HISTORY tin gần nhất)
        List<ChatMessage> history = messageRepository.findByConversationIdOrderByIdAsc(conv.getId());
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        int start = Math.max(0, history.size() - MAX_HISTORY);
        for (int i = start; i < history.size(); i++) {
            ChatMessage m = history.get(i);
            messages.add(Map.of("role", m.getRole().name(), "content", m.getContent()));
        }

        // 4. Gọi AI
        String reply = aiClient.chat(messages);

        // 5. Lưu câu trả lời của bot
        ChatMessage botMsg = ChatMessage.builder()
                .conversation(conv)
                .role(ChatRole.assistant)
                .content(reply)
                .build();
        messageRepository.save(botMsg);

        // 6. Cập nhật thời điểm hoạt động của hội thoại
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return new ChatResponse(conv.getId(), reply);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  STREAMING + TOOL CALLING  (endpoint POST /api/chat/stream)
    // ════════════════════════════════════════════════════════════════════════

    /** Khởi tạo SSE: lưu tin nhắn người dùng, gửi meta, rồi chạy AI ở luồng nền. */
    public SseEmitter streamChat(ChatRequest req, Integer userId) {
        SseEmitter emitter = new SseEmitter(120_000L); // timeout 2 phút, tránh giữ connection vô hạn
        Prepared prep = prepareStream(req, userId);

        try {
            emitter.send(SseEmitter.event().name("meta")
                    .data(Map.of("conversationId", prep.conversationId())));
        } catch (IOException e) {
            emitter.completeWithError(e);
            return emitter;
        }

        streamExecutor.submit(() -> runStream(prep, emitter));
        return emitter;
    }

    /** Lưu tin nhắn user + dựng danh sách messages (system + lịch sử). */
    @Transactional
    public Prepared prepareStream(ChatRequest req, Integer userId) {
        ChatConversation conv = resolveConversation(req, userId);

        messageRepository.save(ChatMessage.builder()
                .conversation(conv).role(ChatRole.user).content(req.getMessage()).build());

        List<ChatMessage> history = messageRepository.findByConversationIdOrderByIdAsc(conv.getId());
        List<Map<String, Object>> messages = new ArrayList<>();
        // System prompt + ngày hiện tại (để AI suy ra "hôm nay"/"ngày mai" cho check_availability)
        String systemContent = SYSTEM_PROMPT + "\n\n# NGÀY HIỆN TẠI\nHôm nay là " + LocalDate.now() + ".";
        messages.add(Map.of("role", "system", "content", systemContent));
        int start = Math.max(0, history.size() - MAX_HISTORY);
        for (int i = start; i < history.size(); i++) {
            ChatMessage m = history.get(i);
            messages.add(Map.of("role", m.getRole().name(), "content", m.getContent()));
        }
        return new Prepared(conv.getId(), messages, userId);
    }

    /** Vòng lặp: gọi AI (có tool) tối đa MAX_TOOL_STEPS lần, rồi stream câu trả lời cuối. */
    private void runStream(Prepared prep, SseEmitter emitter) {
        DeltaSink sink = new DeltaSink(chunk -> {
            try {
                emitter.send(SseEmitter.event().name("delta").data(Map.of("content", chunk)));
            } catch (IOException e) {
                throw new RuntimeException(e); // hủy stream nếu client ngắt kết nối
            }
        });
        try {
            List<Map<String, Object>> messages = prep.messages();
            int toolRounds = 0;

            while (true) {
                boolean allowTools = toolRounds < MAX_TOOL_STEPS;
                AiClient.StreamResult result = aiClient.streamCompletion(
                        messages,
                        allowTools ? chatTools.definitions() : null,
                        sink::accept);

                boolean wantsTool = allowTools
                        && result.toolCalls() != null && !result.toolCalls().isEmpty();
                if (!wantsTool) break;

                // AI yêu cầu gọi tool → thực thi rồi đưa kết quả lại cho AI
                messages.add(buildAssistantToolEcho(result));
                for (AiClient.ToolCall tc : result.toolCalls()) {
                    ChatTools.ToolResult toolResult = chatTools.execute(tc.name(), tc.arguments(), prep.userId());

                    // JSON thô đưa lại cho model để nó viết câu dẫn
                    Map<String, Object> toolMsg = new HashMap<>();
                    toolMsg.put("role", "tool");
                    toolMsg.put("tool_call_id", tc.id());
                    toolMsg.put("content", toolResult.forModel());
                    messages.add(toolMsg);

                    // Nếu tool có CARD → đẩy ngay cho frontend render thẻ trực quan
                    if (toolResult.cardType() != null && toolResult.cardData() != null) {
                        safeSend(emitter, "card", Map.of(
                                "type", toolResult.cardType(),
                                "data", toolResult.cardData()));
                    }
                }
                toolRounds++;
            }

            sink.flush();

            // Fallback: thỉnh thoảng model trả completion rỗng khi bật tool.
            // Nếu chưa stream được chữ nào → ép gọi lần cuối KHÔNG tools để luôn có câu trả lời.
            if (sink.length() == 0) {
                log.warn("[chat] phản hồi rỗng sau vòng tool — gọi lại lần cuối không tool");
                aiClient.streamCompletion(messages, null, sink::accept);
                sink.flush();
            }
        } catch (Exception e) {
            // Lỗi gọi AI (vd: 429 quá tải) → trả câu xin lỗi mượt mà thay vì để trống
            log.warn("[chat] lỗi gọi AI: {}", e.getMessage());
            if (sink.length() == 0) {
                String busy = "Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau giây lát nhé!";
                safeSend(emitter, "delta", Map.of("content", busy));
                sink.appendRaw(busy);
            }
        }

        // Luôn lưu + báo done + đóng (không completeWithError để tránh log lỗi servlet)
        try {
            saveAssistantMessage(prep.conversationId(), sink.text());
        } catch (Exception ignored) {
        }
        safeSend(emitter, "done", Map.of("conversationId", prep.conversationId()));
        emitter.complete();
    }

    /** Gửi event SSE, nuốt lỗi nếu client đã ngắt kết nối. */
    private void safeSend(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (Exception ignored) {
        }
    }

    /**
     * Lọc các token placeholder {...} mà model đôi khi tự bịa (vd "{list_doctors}")
     * trước khi stream về client. Giữ lại phần dư có dấu "{" chưa đóng để ghép với delta sau.
     */
    static final class DeltaSink {
        private final Consumer<String> out;
        private final StringBuilder full = new StringBuilder();
        private final StringBuilder hold = new StringBuilder();

        DeltaSink(Consumer<String> out) {
            this.out = out;
        }

        void accept(String delta) {
            if (delta == null || delta.isEmpty()) return;
            hold.append(delta);
            int open = hold.indexOf("{");
            while (open >= 0) {
                int close = hold.indexOf("}", open + 1);
                if (close < 0) {
                    emit(hold.substring(0, open));
                    hold.delete(0, open);
                    return;
                }
                emit(hold.substring(0, open));
                String inner = hold.substring(open + 1, close).trim();
                if (!inner.matches("[\\w\\s\\-]{1,50}")) emit(hold.substring(open, close + 1));
                hold.delete(0, close + 1);
                open = hold.indexOf("{");
            }
            emit(hold.toString());
            hold.setLength(0);
        }

        void flush() {
            emit(hold.toString());
            hold.setLength(0);
        }

        void appendRaw(String text) {
            full.append(text);
        }

        int length() {
            return full.length() + hold.length();
        }

        String text() {
            return full.toString();
        }

        private void emit(String s) {
            if (s.isEmpty()) return;
            full.append(s);
            out.accept(s);
        }
    }

    /** Dựng lại message "assistant" chứa tool_calls để gửi kèm cho lượt gọi tiếp theo. */
    private Map<String, Object> buildAssistantToolEcho(AiClient.StreamResult result) {
        List<Map<String, Object>> toolCalls = new ArrayList<>();
        for (AiClient.ToolCall tc : result.toolCalls()) {
            toolCalls.add(Map.of(
                    "id", tc.id(),
                    "type", "function",
                    "function", Map.of("name", tc.name(), "arguments", tc.arguments())
            ));
        }
        Map<String, Object> echo = new HashMap<>();
        echo.put("role", "assistant");
        echo.put("content", result.content() == null ? "" : result.content());
        echo.put("tool_calls", toolCalls);
        return echo;
    }

    @Transactional
    public void saveAssistantMessage(Integer conversationId, String text) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Cuộc hội thoại không tồn tại"));
        messageRepository.save(ChatMessage.builder()
                .conversation(conv).role(ChatRole.assistant)
                .content(text == null || text.isBlank() ? "(không có nội dung)" : text)
                .build());
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);
    }

    /**
     * Lấy hội thoại của user trong NGÀY HÔM NAY để FE khôi phục sau khi reload.
     * Đồng thời dọn các hội thoại cũ (từ ngày trước) của user này.
     */
    @Transactional
    public ChatHistoryResponse getHistory(Integer userId) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        conversationRepository.deleteByUserIdAndUpdatedAtBefore(userId, startOfToday);

        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .findFirst()
                .map(conv -> {
                    List<ChatHistoryResponse.Message> messages = messageRepository
                            .findByConversationIdOrderByIdAsc(conv.getId()).stream()
                            .filter(m -> m.getCreatedAt() == null || !m.getCreatedAt().isBefore(startOfToday))
                            .map(m -> new ChatHistoryResponse.Message(m.getRole().name(), m.getContent()))
                            .toList();
                    return new ChatHistoryResponse(conv.getId(), messages);
                })
                .orElse(new ChatHistoryResponse(null, List.of()));
    }

    /** Xóa toàn bộ lịch sử chat (user lẫn khách) cũ hơn ngày hôm nay — chạy 3h sáng mỗi ngày. */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldConversations() {
        conversationRepository.deleteByUpdatedAtBefore(LocalDate.now().atStartOfDay());
        log.info("[chat] đã dọn lịch sử chat cũ hơn hôm nay");
    }

    /** Holder: id hội thoại + danh sách message gửi cho AI + userId (null nếu khách chưa đăng nhập). */
    public record Prepared(Integer conversationId, List<Map<String, Object>> messages, Integer userId) {}

    private ChatConversation resolveConversation(ChatRequest req, Integer userId) {
        if (req.getConversationId() != null) {
            // Chỉ dùng lại hội thoại nếu còn tồn tại VÀ thuộc ngày hôm nay; nếu không → tạo mới.
            LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
            ChatConversation existing = conversationRepository.findById(req.getConversationId()).orElse(null);
            if (existing != null && existing.getUpdatedAt() != null
                    && !existing.getUpdatedAt().isBefore(startOfToday)) {
                return existing;
            }
        }

        // Tạo mới — tiêu đề = câu hỏi đầu tiên (cắt 80 ký tự)
        ChatConversation conv = new ChatConversation();
        if (userId != null) {
            userRepository.findById(userId).ifPresent(conv::setUser);
        }
        conv.setGuestId(req.getGuestId());
        String msg = req.getMessage().trim();
        conv.setTitle(msg.length() > 80 ? msg.substring(0, 80) : msg);
        return conversationRepository.save(conv);
    }
}
