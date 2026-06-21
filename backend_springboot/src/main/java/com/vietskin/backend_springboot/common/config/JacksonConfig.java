package com.vietskin.backend_springboot.common.config;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
public class JacksonConfig {

    /**
     * Đăng ký Hibernate6Module để Jackson xử lý an toàn các Hibernate proxy
     * (serialize proxy chưa khởi tạo thành null thay vì ném lỗi ByteBuddyInterceptor).
     *
     * FORCE_LAZY_LOADING đã TẮT (mặc định của module): không ép tải quan hệ LAZY khi
     * serialize → hết N+1 do serialization. Điều kiện để tắt an toàn: TẤT CẢ endpoint
     * đã trả DTO (appointments, invoices, medical-records, prescriptions, rooms...),
     * các entity còn trả thẳng (Medicine, Service, Notification, MedicalRecordImage)
     * không có quan hệ LAZY nào bị serialize (hoặc đã @JsonIgnore).
     */
    @Bean
    public Hibernate6Module hibernate6Module() {
        return new Hibernate6Module();
    }

    /**
     * Cấu hình Jackson toàn cục: khi nhận chuỗi rỗng ("") cho trường Enum,
     * tự động coerce thành null thay vì ném lỗi parse.
     * Fix lỗi: "Cannot coerce empty String to Gender enum value"
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> builder.postConfigurer(objectMapper -> {
            objectMapper.coercionConfigFor(Enum.class)
                    .setCoercion(CoercionInputShape.EmptyString, CoercionAction.AsNull);
        });
    }
}
