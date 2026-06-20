package com.vietskin.backend_springboot.common.utils;

import com.vietskin.backend_springboot.common.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Objects;

/**
 * Tiện ích đọc thông tin người dùng hiện tại từ SecurityContext.
 * Dùng để kiểm tra quyền sở hữu (ownership) ngay trong tầng service, tránh IDOR
 * mà không phải truyền userId/role xuống qua từng controller.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /** ID người dùng đang đăng nhập (chính là username trong UserDetails), null nếu chưa đăng nhập. */
    public static Integer currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetails ud)) return null;
        try {
            return Integer.valueOf(ud.getUsername());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Người dùng hiện tại có role chỉ định không (vd "patient", "doctor"). */
    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> ("ROLE_" + role).equals(a.getAuthority()));
    }

    /**
     * Nếu người gọi là bệnh nhân thì chỉ được truy cập tài nguyên của chính mình.
     * Nhân viên (admin/lễ tân/bác sĩ) được bỏ qua kiểm tra này.
     */
    public static void requireSelfIfPatient(Integer ownerId) {
        if (hasRole("patient") && !Objects.equals(ownerId, currentUserId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này");
        }
    }
}
