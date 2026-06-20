package com.vietskin.backend_springboot.modules.users.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.users.dto.*;
import com.vietskin.backend_springboot.modules.users.entity.*;
import com.vietskin.backend_springboot.modules.users.mapper.UserMapper;
import com.vietskin.backend_springboot.modules.users.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    @Cacheable(value = "users")
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(UserMapper::toResponse)
                .toList();
    }

    public ProfileResponse findByPhone(String phone) {
        User u = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bệnh nhân với SĐT này"));
        if (!"patient".equals(u.getRole().getCode())) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bệnh nhân với SĐT này");
        }
        return UserMapper.toSummary(u);
    }

    @Cacheable(value = "user_detail", key = "#id")
    public UserDetailResponse findOne(Integer id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
        return UserMapper.toDetail(u);
    }

    @Cacheable(value = "user_profile", key = "#id")
    public ProfileResponse getProfile(Integer id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
        return UserMapper.toProfile(u);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", allEntries = true),
            @CacheEvict(value = "user_profile", key = "#id"),
            @CacheEvict(value = "user_detail", key = "#id")
    })
    public ProfileResponse updateProfile(Integer id, UpdateProfileRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        if (req.getName() != null)
            u.setName(req.getName());
        if (req.getEmail() != null)
            u.setEmail(req.getEmail());
        if (req.getAvatar() != null)
            u.setAvatar(req.getAvatar());
        userRepository.save(u);

        // Upsert PatientProfile
        boolean hasProfileData = req.getDateOfBirth() != null || req.getGender() != null
                || req.getAddress() != null || req.getProvince() != null
                || req.getDistrict() != null || req.getWard() != null
                || req.getCitizenId() != null || req.getEthnicity() != null
                || req.getBloodType() != null || req.getAllergies() != null
                || req.getMedicalHistory() != null || req.getEmergencyContact() != null;

        if (hasProfileData) {
            PatientProfile p = patientProfileRepository.findByUserId(id)
                    .orElseGet(() -> PatientProfile.builder().user(u).build());

            if (req.getDateOfBirth() != null)
                p.setDateOfBirth(req.getDateOfBirth());
            if (req.getGender() != null)
                p.setGender(req.getGender());
            if (req.getAddress() != null)
                p.setAddress(req.getAddress());
            if (req.getProvince() != null)
                p.setProvince(req.getProvince());
            if (req.getDistrict() != null)
                p.setDistrict(req.getDistrict());
            if (req.getWard() != null)
                p.setWard(req.getWard());
            if (req.getCitizenId() != null)
                p.setCitizenId(req.getCitizenId());
            if (req.getEthnicity() != null)
                p.setEthnicity(req.getEthnicity());
            if (req.getBloodType() != null)
                p.setBloodType(req.getBloodType());
            if (req.getAllergies() != null)
                p.setAllergies(req.getAllergies());
            if (req.getMedicalHistory() != null)
                p.setMedicalHistory(req.getMedicalHistory());
            if (req.getEmergencyContact() != null)
                p.setEmergencyContact(req.getEmergencyContact());
            patientProfileRepository.save(p);
        }

        return getProfile(id);
    }

    public MessageResponse changePassword(Integer id, ChangePasswordRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), u.getPasswordHash()))
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");

        u.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(u);
        return new MessageResponse("Đổi mật khẩu thành công");
    }

    @Caching(evict = {
            @CacheEvict(value = "users", allEntries = true),
            @CacheEvict(value = "user_profile", key = "#id"),
            @CacheEvict(value = "user_detail", key = "#id")
    })
    public StatusResponse toggleActive(Integer id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
        u.setActive(!u.getActive());
        userRepository.save(u);
        return new StatusResponse(u.getId(), u.getActive());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", allEntries = true),
            @CacheEvict(value = "user_profile", key = "#id"),
            @CacheEvict(value = "user_detail", key = "#id")
    })
    public StatusResponse deleteUser(Integer id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        doctorRepository.findByUserId(id).ifPresent(d -> {
            d.setActive(false);
            doctorRepository.save(d);
        });

        u.setActive(false);
        userRepository.save(u);
        return new StatusResponse(u.getId(), false);
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public ProfileResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByPhone(req.getPhone()))
            throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã được đăng ký");

        Role role = roleRepository.findByCode(req.getRoleCode())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "Role '" + req.getRoleCode() + "' không tồn tại"));

        User u = User.builder()
                .username(req.getRoleCode() + "_" + req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .avatar(req.getAvatar())
                .role(role)
                .active(true)
                .build();
        u = userRepository.save(u);

        return UserMapper.toSummary(u);
    }

    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public ProfileResponse createStaff(CreateStaffRequest req) {
        if (userRepository.existsByPhone(req.getPhone()))
            throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã được đăng ký");

        Role role = roleRepository.findByCode(req.getRoleCode())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "Role '" + req.getRoleCode() + "' không tồn tại"));

        User u = User.builder()
                .username(req.getRoleCode() + "_" + req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .avatar(req.getAvatar())
                .role(role)
                .active(true)
                .build();
        u = userRepository.save(u);

        if ("doctor".equals(req.getRoleCode())) {
            Doctor doctor = Doctor.builder()
                    .user(u)
                    .specialty(req.getSpecialty())
                    .degree(req.getDegree())
                    .experience(req.getExperience())
                    .description(req.getDescription())
                    .keywords("[]")
                    .consultationFee(req.getConsultationFee() != null
                            ? req.getConsultationFee()
                            : java.math.BigDecimal.valueOf(150000))
                    .active(true)
                    .build();
            doctorRepository.save(doctor);
        }

        return UserMapper.toSummary(u);
    }
}
