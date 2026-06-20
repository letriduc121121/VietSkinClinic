package com.vietskin.backend_springboot.common.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
}
