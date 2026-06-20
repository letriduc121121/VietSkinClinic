package com.vietskin.backend_springboot.modules.chatbot.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.chatbot.dto.ChatHistoryResponse;
import com.vietskin.backend_springboot.modules.chatbot.dto.ChatRequest;
import com.vietskin.backend_springboot.modules.chatbot.dto.ChatResponse;
import com.vietskin.backend_springboot.modules.chatbot.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Gửi 1 tin nhắn tới chatbot. Cho phép cả khách chưa đăng nhập (userDetails = null).
     * Nếu đã đăng nhập → hội thoại được gắn với userId để xem lại sau.
     */
    @PostMapping
    public ApiResponse<ChatResponse> chat(
            @Valid @RequestBody ChatRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = (userDetails != null)
                ? Integer.parseInt(userDetails.getUsername())
                : null;
        return ApiResponse.ok(chatService.chat(req, userId));
    }

    /**
     * Bản STREAMING + Tool Calling: trả về luồng SSE (event: meta / delta / done / error).
     * Bot có thể tự tra cứu dịch vụ & bác sĩ thật trước khi trả lời.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @Valid @RequestBody ChatRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = (userDetails != null)
                ? Integer.parseInt(userDetails.getUsername())
                : null;
        return chatService.streamChat(req, userId);
    }

    /**
     * Lấy lịch sử hội thoại gần nhất của user đang đăng nhập để FE khôi phục sau khi reload.
     * Khách chưa đăng nhập → trả về rỗng.
     */
    @GetMapping("/history")
    public ApiResponse<ChatHistoryResponse> history(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ApiResponse.ok(new ChatHistoryResponse(null, java.util.List.of()));
        }
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(chatService.getHistory(userId));
    }
}
