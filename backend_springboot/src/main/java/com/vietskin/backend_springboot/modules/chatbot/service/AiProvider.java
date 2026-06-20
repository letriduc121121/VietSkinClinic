package com.vietskin.backend_springboot.modules.chatbot.service;

/**
 * Thông tin 1 nhà cung cấp AI (OpenAI-compatible).
 * Được đọc từ cấu hình {@code ai.providers[]} trong application.yml.
 */
public record AiProvider(String name, String baseUrl, String apiKey, String model) {

    /** Provider có API key hợp lệ (không rỗng) → có thể dùng được. */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
