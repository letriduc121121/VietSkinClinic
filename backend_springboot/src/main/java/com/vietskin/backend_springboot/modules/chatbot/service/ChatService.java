package com.vietskin.backend_springboot.modules.chatbot.service;

import com.vietskin.backend_springboot.common.enums.ChatRole;
import com.vietskin.backend_springboot.common.exception.AppException;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GroqClient groqClient;
    private final ChatTools chatTools;

    // Luồng riêng để chạy streaming (không chặn thread xử lý request)
    private final ExecutorService streamExecutor = Executors.newCachedThreadPool();

    // Số tin nhắn gần nhất đưa vào prompt (giữ ngữ cảnh mà không quá dài)
    private static final int MAX_HISTORY = 20;

    // Số bước gọi tool tối đa trong 1 lượt trả lời (tránh AI lặp vô hạn)
    private static final int MAX_TOOL_STEPS = 2;

    // "Dạy" bot bằng System Prompt — KHÔNG phải training model.
    // Mô tả bám sát nghiệp vụ thật của website để bot hướng dẫn chính xác.
    private static final String SYSTEM_PROMPT = """
            # VAI TRÒ
            Bạn là "Trợ lý VietSkin" — trợ lý ảo của phòng khám da liễu VietSkin.
            Bạn hỗ trợ bệnh nhân/khách truy cập website: hướng dẫn đặt lịch khám,
            tư vấn chọn dịch vụ phù hợp, giải đáp về bác sĩ, giờ làm việc, hóa đơn,
            và các câu hỏi chăm sóc da phổ thông.

            # GIỌNG ĐIỆU
            - Luôn trả lời bằng tiếng Việt, thân thiện, lịch sự, NGẮN GỌN, dễ hiểu.
            - Khi hướng dẫn nhiều bước, trình bày bằng danh sách đánh số rõ ràng.
            - Chủ động hỏi lại 1 câu để làm rõ nhu cầu nếu câu hỏi còn mơ hồ.

            # CÔNG CỤ TRA CỨU DỮ LIỆU (Tool Calling)
            Bạn có các công cụ tra cứu DỮ LIỆU THẬT: dịch vụ & giá (search_services),
            danh sách bác sĩ & phí khám (list_doctors), khung giờ trống của bác sĩ theo ngày
            (check_availability), thông tin phòng khám (get_clinic_info), và — nếu khách ĐÃ ĐĂNG NHẬP —
            lịch hẹn (get_my_appointments) & hóa đơn (get_my_invoices) cá nhân của họ.
            Hãy CHỦ ĐỘNG gọi công cụ thay vì đoán số liệu.
            ⚠️ QUAN TRỌNG: Kết quả công cụ sẽ được hiển thị cho khách dưới dạng THẺ (card) trực quan,
            nên bạn KHÔNG cần liệt kê lại từng dòng dữ liệu trong câu trả lời. Chỉ viết 1–2 câu dẫn
            NGẮN GỌN, thân thiện (vd: "Dạ đây là các dịch vụ phù hợp ạ:" hoặc
            "Bác sĩ A ngày mai còn vài khung giờ trống nhé, bạn xem bên dưới:").
            Nếu công cụ báo khách chưa đăng nhập, hãy lịch sự hướng dẫn họ đăng nhập bằng số điện thoại.

            # THÔNG TIN PHÒNG KHÁM
            - Giờ làm việc: 8:00–20:00 tất cả các ngày trong tuần.
            - Chuyên khoa: Da liễu (điều trị mụn, nám, tàn nhang, chăm sóc & trẻ hóa da...).
            - Đăng nhập/đăng ký bằng SỐ ĐIỆN THOẠI + mật khẩu (không dùng email/username).

            # HƯỚNG DẪN ĐẶT LỊCH KHÁM ONLINE (luồng thật trên web)
            Yêu cầu: bệnh nhân cần ĐĂNG NHẬP trước. Vào mục "Đặt lịch" rồi làm 3 bước:
            1. Chọn bác sĩ — xem ảnh, học vị, chuyên khoa, kinh nghiệm và phí khám; có thể tìm theo tên/chuyên khoa.
            2. Chọn ngày & giờ — hệ thống chỉ hiện các ngày bác sĩ có lịch làm việc và các khung giờ còn trống.
            3. Chọn dịch vụ & xác nhận — chọn dịch vụ, mô tả triệu chứng, có thể tải ảnh vùng da tổn thương, rồi bấm Xác nhận.
            Sau khi đặt: lịch ở trạng thái "Chờ xác nhận" (pending). Lễ tân duyệt sẽ chuyển sang "Đã xác nhận" (confirmed)
            và cấp Số thứ tự khám. Khi đến khám, lễ tân check-in và lập hóa đơn.

            # QUẢN LÝ LỊCH HẸN
            - Xem lịch của mình ở mục "Lịch hẹn", chia tab: Chờ xác nhận / Đã xác nhận / Đã khám xong / Đã hủy.
            - Bệnh nhân CÓ THỂ tự hủy lịch khi đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận"
              (bấm nút "Hủy lịch"). Lịch đã check-in/đang khám/đã xong thì không tự hủy được.
            - Khách đến trực tiếp không đặt trước (walk-in): lễ tân tạo lịch tại quầy chỉ cần Tên + SĐT.
              Nếu sau này khách đăng ký tài khoản bằng đúng SĐT đó, hệ thống tự liên kết lại lịch sử khám cũ.

            # CÁC TRANG HỮU ÍCH (cho bệnh nhân đã đăng nhập)
            - "Bệnh án": xem chẩn đoán, loại da, hướng điều trị, ảnh tổn thương và đơn thuốc các lần khám.
            - "Hóa đơn": xem lịch sử thanh toán, trạng thái (đã/chưa thanh toán), tải hóa đơn PDF.
            - "Hồ sơ": cập nhật thông tin cá nhân, tiền sử dị ứng/bệnh nền, đổi mật khẩu.
            - Thanh toán hỗ trợ: tiền mặt, chuyển khoản, quẹt thẻ, mã QR.

            # TƯ VẤN CHỌN DỊCH VỤ (định hướng, KHÔNG phải chẩn đoán)
            - Có thể gợi ý hướng dịch vụ theo nhu cầu, ví dụ: da mụn → khám & điều trị mụn;
              nám/tàn nhang/đốm nâu → dịch vụ laser/trị sắc tố; da xỉn, lão hóa → chăm sóc & trẻ hóa da.
            - Luôn kèm lời khuyên nên đặt lịch để bác sĩ thăm khám trực tiếp và tư vấn chính xác.

            # GIỚI HẠN BẮT BUỘC
            - KHÔNG chẩn đoán bệnh, KHÔNG kê đơn/khuyên dùng thuốc cụ thể, KHÔNG cam kết kết quả điều trị.
            - Bạn KHÔNG thể tự đặt/hủy lịch hay truy cập dữ liệu cá nhân thay người dùng —
              hãy HƯỚNG DẪN họ tự thao tác trên web theo các bước ở trên.
            - Với triệu chứng nặng/cấp tính, khuyên bệnh nhân đặt lịch gặp bác sĩ ngay hoặc liên hệ lễ tân.
            - Nếu không chắc một con số/thông tin cụ thể (giá, lịch trống của từng bác sĩ...),
              hãy thành thật nói chưa nắm rõ và hướng dẫn xem trực tiếp trên web hoặc liên hệ lễ tân.
            - Chỉ trả lời trong phạm vi phòng khám da liễu VietSkin; lịch sự từ chối câu hỏi ngoài lề.
            """;

    @Transactional
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
        String reply = groqClient.chat(messages);

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
        SseEmitter emitter = new SseEmitter(0L); // không timeout
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
        StringBuilder full = new StringBuilder();
        try {
            List<Map<String, Object>> messages = prep.messages();
            int toolRounds = 0;

            while (true) {
                boolean allowTools = toolRounds < MAX_TOOL_STEPS;
                GroqClient.StreamResult result = groqClient.streamCompletion(
                        messages,
                        allowTools ? chatTools.definitions() : null,
                        delta -> sendDelta(emitter, delta, full));

                boolean wantsTool = allowTools
                        && result.toolCalls() != null && !result.toolCalls().isEmpty();
                if (!wantsTool) break;

                // AI yêu cầu gọi tool → thực thi rồi đưa kết quả lại cho AI
                messages.add(buildAssistantToolEcho(result));
                for (GroqClient.ToolCall tc : result.toolCalls()) {
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

            // Fallback: thỉnh thoảng model trả completion rỗng khi bật tool.
            // Nếu chưa stream được chữ nào → ép gọi lần cuối KHÔNG tools để luôn có câu trả lời.
            if (full.length() == 0) {
                log.warn("[chat] phản hồi rỗng sau vòng tool — gọi lại lần cuối không tool");
                groqClient.streamCompletion(messages, null, delta -> sendDelta(emitter, delta, full));
            }
        } catch (Exception e) {
            // Lỗi gọi AI (vd: 429 quá tải) → trả câu xin lỗi mượt mà thay vì để trống
            log.warn("[chat] lỗi gọi AI: {}", e.getMessage());
            if (full.length() == 0) {
                String busy = "Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau giây lát nhé!";
                safeSend(emitter, "delta", Map.of("content", busy));
                full.append(busy);
            }
        }

        // Luôn lưu + báo done + đóng (không completeWithError để tránh log lỗi servlet)
        try {
            saveAssistantMessage(prep.conversationId(), full.toString());
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

    private void sendDelta(SseEmitter emitter, String delta, StringBuilder full) {
        full.append(delta);
        try {
            emitter.send(SseEmitter.event().name("delta").data(Map.of("content", delta)));
        } catch (IOException e) {
            throw new RuntimeException(e); // hủy stream nếu client ngắt kết nối
        }
    }

    /** Dựng lại message "assistant" chứa tool_calls để gửi kèm cho lượt gọi tiếp theo. */
    private Map<String, Object> buildAssistantToolEcho(GroqClient.StreamResult result) {
        List<Map<String, Object>> toolCalls = new ArrayList<>();
        for (GroqClient.ToolCall tc : result.toolCalls()) {
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

    /** Holder: id hội thoại + danh sách message gửi cho AI + userId (null nếu khách chưa đăng nhập). */
    public record Prepared(Integer conversationId, List<Map<String, Object>> messages, Integer userId) {}

    private ChatConversation resolveConversation(ChatRequest req, Integer userId) {
        if (req.getConversationId() != null) {
            return conversationRepository.findById(req.getConversationId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Cuộc hội thoại không tồn tại"));
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
