package com.vietskin.backend_springboot.modules.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.common.exception.AppException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Consumer;
import java.util.stream.Stream;

/**
 * Client gọi AI đa nhà cung cấp (Multi-Provider) với cơ chế fallback tự động.
 * <p>
 * Thay thế {@code GroqClient} cũ. Giữ nguyên interface {@link #chat} và
 * {@link #streamCompletion} để {@link ChatService} không cần đổi logic.
 * <p>
 * Danh sách provider được cấu hình trong {@code application.yml} (xem {@link AiProperties}).
 * Khi gọi AI, hệ thống thử lần lượt từng provider theo thứ tự ưu tiên.
 * Nếu provider hiện tại lỗi (401, 429, 5xx, timeout), tự động chuyển sang provider tiếp theo.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiClient {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(60);

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .build();

    private List<AiProvider> providers;

    @PostConstruct
    void init() {
        providers = aiProperties.activeProviders();
        if (providers.isEmpty()) {
            log.error("⚠️ Không có nhà cung cấp AI nào được cấu hình! Chatbot sẽ không hoạt động.");
        } else {
            log.info("✅ AI Providers đã cấu hình ({}):", providers.size());
            providers.forEach(p -> log.info("   ├─ {} | model={} | url={}", p.name(), p.model(), p.baseUrl()));
        }
    }

    // ── 1. Gọi thường (không streaming, không tool) ──────────────────────────

    public String chat(List<Map<String, String>> messages) {
        for (int i = 0; i < providers.size(); i++) {
            AiProvider provider = providers.get(i);
            try {
                return chatSingle(provider, messages);
            } catch (Exception e) {
                log.warn("[AI] {} thất bại: {} → {}", provider.name(), e.getMessage(),
                        i + 1 < providers.size() ? "chuyển sang " + providers.get(i + 1).name() : "hết provider");
            }
        }
        throw new AppException(HttpStatus.BAD_GATEWAY, "Tất cả nhà cung cấp AI đều không phản hồi");
    }

    private String chatSingle(AiProvider provider, List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
                "model", provider.model(),
                "messages", messages,
                "temperature", 0.6,
                "max_tokens", 1024
        );
        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder(URI.create(provider.baseUrl() + "/chat/completions"))
                    .header("Authorization", "Bearer " + provider.apiKey())
                    .header("Content-Type", "application/json")
                    .timeout(READ_TIMEOUT)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() >= 400) {
                String errorBody = resp.body();
                log.error("❌ [AI] Lỗi từ {}: HTTP {} - Body: {}", provider.name(), resp.statusCode(), errorBody);
                throw new AppException(HttpStatus.BAD_GATEWAY,
                        provider.name() + " trả lỗi HTTP " + resp.statusCode());
            }

            JsonNode root = objectMapper.readTree(resp.body());
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                throw new AppException(HttpStatus.BAD_GATEWAY, provider.name() + " không trả về nội dung");
            }
            return content.asText();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_GATEWAY,
                    "Không gọi được " + provider.name() + ": " + e.getMessage());
        }
    }

    // ── 2. Streaming thật + Tool Calling ─────────────────────────────────────

    /**
     * Gọi AI ở chế độ streaming với fallback tự động.
     * Thử lần lượt từng provider; nếu lỗi → chuyển sang provider kế tiếp.
     */
    public StreamResult streamCompletion(List<Map<String, Object>> messages,
                                         List<Map<String, Object>> tools,
                                         Consumer<String> onDelta) {
        for (int i = 0; i < providers.size(); i++) {
            AiProvider provider = providers.get(i);
            try {
                return streamSingle(provider, messages, tools, onDelta);
            } catch (Exception e) {
                log.warn("[AI-Stream] {} thất bại: {} → {}", provider.name(), e.getMessage(),
                        i + 1 < providers.size() ? "chuyển sang " + providers.get(i + 1).name() : "hết provider");
            }
        }
        throw new AppException(HttpStatus.BAD_GATEWAY, "Tất cả nhà cung cấp AI đều không phản hồi");
    }

    private StreamResult streamSingle(AiProvider provider,
                                      List<Map<String, Object>> messages,
                                      List<Map<String, Object>> tools,
                                      Consumer<String> onDelta) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", provider.model());
        body.put("messages", messages);
        body.put("stream", true);
        body.put("temperature", 0.4);
        body.put("max_tokens", 1024);
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
            body.put("tool_choice", "auto");
        }

        StringBuilder content = new StringBuilder();
        Map<Integer, ToolAcc> toolAccs = new TreeMap<>();
        String[] finishReason = {null};

        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder(URI.create(provider.baseUrl() + "/chat/completions"))
                    .header("Authorization", "Bearer " + provider.apiKey())
                    .header("Content-Type", "application/json")
                    .timeout(READ_TIMEOUT)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<Stream<String>> resp =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofLines());

            if (resp.statusCode() >= 400) {
                // Đọc hết body lỗi để ghi log
                StringBuilder errorBody = new StringBuilder();
                try (Stream<String> lines = resp.body()) { 
                    lines.forEach(errorBody::append); 
                }
                log.error("❌ [AI-Stream] Lỗi từ {}: HTTP {} - Body: {}", provider.name(), resp.statusCode(), errorBody);
                throw new AppException(HttpStatus.BAD_GATEWAY,
                        provider.name() + " trả lỗi HTTP " + resp.statusCode());
            }

            try (Stream<String> lines = resp.body()) {
                lines.forEach(line -> {
                    if (!line.startsWith("data:")) return;
                    String data = line.substring(5).trim();
                    if (data.isEmpty() || data.equals("[DONE]")) return;
                    try {
                        JsonNode choice = objectMapper.readTree(data).path("choices").path(0);
                        JsonNode delta = choice.path("delta");

                        JsonNode c = delta.path("content");
                        if (c.isTextual() && !c.asText().isEmpty()) {
                            content.append(c.asText());
                            onDelta.accept(c.asText());
                        }

                        JsonNode tcs = delta.path("tool_calls");
                        if (tcs.isArray()) {
                            for (JsonNode tc : tcs) {
                                int idx = tc.path("index").asInt(0);
                                ToolAcc acc = toolAccs.computeIfAbsent(idx, k -> new ToolAcc());
                                if (tc.hasNonNull("id")) acc.id = tc.get("id").asText();
                                JsonNode fn = tc.path("function");
                                if (fn.hasNonNull("name")) acc.name = fn.get("name").asText();
                                if (fn.hasNonNull("arguments")) acc.args.append(fn.get("arguments").asText());
                            }
                        }

                        if (choice.hasNonNull("finish_reason")) {
                            finishReason[0] = choice.get("finish_reason").asText();
                        }
                    } catch (Exception ignore) {
                        // bỏ qua dòng SSE lỗi định dạng
                    }
                });
            }

            List<ToolCall> toolCalls = new ArrayList<>();
            for (ToolAcc a : toolAccs.values()) {
                if (a.name != null) toolCalls.add(new ToolCall(a.id, a.name, a.args.toString()));
            }

            log.debug("[AI-Stream] {} hoàn thành: {} ký tự, {} tool calls",
                    provider.name(), content.length(), toolCalls.size());

            return new StreamResult(content.toString(), toolCalls, finishReason[0]);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_GATEWAY,
                    "Không gọi được " + provider.name() + ": " + e.getMessage());
        }
    }

    // ── Cấu trúc dữ liệu ─────────────────────────────────────────────────────

    private static class ToolAcc {
        String id;
        String name;
        final StringBuilder args = new StringBuilder();
    }

    public record ToolCall(String id, String name, String arguments) {}

    public record StreamResult(String content, List<ToolCall> toolCalls, String finishReason) {}
}
