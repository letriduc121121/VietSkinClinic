package com.vietskin.backend_springboot.modules.chatbot.service;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Bind cấu hình {@code ai.providers[]} từ application.yml thành danh sách
 * {@link AiProvider} để {@link AiClient} dùng.
 *
 * <pre>
 * ai:
 *   providers:
 *     - name: Groq
 *       base-url: https://api.groq.com/openai/v1
 *       api-key: ${GROQ_API_KEY:}
 *       model: llama-3.3-70b-versatile
 * </pre>
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private List<ProviderConfig> providers = new ArrayList<>();

    @Data
    public static class ProviderConfig {
        private String name;
        private String baseUrl;
        private String apiKey;
        private String model;

        public AiProvider toProvider() {
            return new AiProvider(name, baseUrl, apiKey, model);
        }
    }

    /** Trả về danh sách provider đã có API key (bỏ qua những provider chưa cấu hình key). */
    public List<AiProvider> activeProviders() {
        return providers.stream()
                .map(ProviderConfig::toProvider)
                .filter(AiProvider::isConfigured)
                .toList();
    }
}
