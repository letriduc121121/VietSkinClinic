package com.vietskin.backend_springboot.modules.chatbot.dto;

import java.util.List;

// Lịch sử hội thoại gần nhất của user (để FE dựng lại khung chat sau khi reload)
public record ChatHistoryResponse(Integer conversationId, List<Message> messages) {
    public record Message(String role, String content) {}
}
