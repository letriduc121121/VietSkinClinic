-- ============================================================
-- SEED NEW: Tạo dữ liệu mẫu mới cho VietSkin Clinic
-- Yêu cầu:
--   - 3 Admin (admin, admin02, admin03)
--   - 5 Lễ tân (letan01 .. letan05)
--   - 4 Bác sĩ (bacsi01 .. bacsi04)
--   - 4 Phòng khám (Phòng khám 1 .. 4)
--   - 20 Bệnh nhân (benhnhan01 .. benhnhan20)
--   - Danh mục dịch vụ gấp đôi (4 danh mục thay vì 2)
--   - Các dịch vụ cốt lõi: Khám mụn, Khám tổng quát, Khám viêm da, Khám dị ứng
-- Mật khẩu mặc định: Vietskin@123
-- Chạy: mysql -u root -p vietskin < db/seed_new.sql
-- ============================================================

USE vietskin;
SET NAMES utf8mb4;

-- Xóa dữ liệu cũ trong các bảng liên quan trước khi nạp mới (tránh xung đột FK)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE chat_conversations;
TRUNCATE TABLE notifications;
TRUNCATE TABLE invoices;
TRUNCATE TABLE prescription_items;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE medical_record_images;
TRUNCATE TABLE medical_records;
TRUNCATE TABLE appointments;
TRUNCATE TABLE time_slots;
TRUNCATE TABLE doctor_work_days;
TRUNCATE TABLE rooms;
TRUNCATE TABLE doctors;
TRUNCATE TABLE patient_profiles;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
TRUNCATE TABLE services;
TRUNCATE TABLE medicines;
SET FOREIGN_KEY_CHECKS = 1;

-- Hash mật khẩu mặc định "Vietskin@123"
SET @pw := '$2b$10$QEcmpzoL8saGygoB6nILFOMhoZjOBG8XjtQFwR7fYeg3cTDHwzPoq';

-- ── 1. ROLES ─────────────────────────────────────────────────
INSERT INTO roles (id, code, name, description, active, created_at) VALUES
(1, 'admin', 'Quản trị viên', 'Quản trị toàn bộ hệ thống', 1, NOW()),
(2, 'doctor', 'Bác sĩ', 'Bác sĩ chuyên môn da liễu', 1, NOW()),
(3, 'receptionist', 'Lễ tân', 'Nhân viên lễ tân tiếp đón', 1, NOW()),
(4, 'patient', 'Bệnh nhân', 'Người dùng cuối - bệnh nhân', 1, NOW());

-- ── 2. USERS (ADMINS, RECEPTIONISTS, DOCTORS) ────────────────
-- 3 Admin (SĐT: 0901234567, 0901234573, 0901234574)
INSERT INTO users (id, username, password_hash, name, email, phone, active, created_at, updated_at, role_id) VALUES
(1, 'admin', @pw, 'Quản trị viên 1', 'admin01@vietskin.vn', '0901234567', 1, NOW(), NOW(), 1),
(2, 'admin02', @pw, 'Quản trị viên 2', 'admin02@vietskin.vn', '0901234573', 1, NOW(), NOW(), 1),
(3, 'admin03', @pw, 'Quản trị viên 3', 'admin03@vietskin.vn', '0901234574', 1, NOW(), NOW(), 1);

-- 5 Lễ tân (SĐT: 0901234568, 0901234575 .. 0901234578)
INSERT INTO users (id, username, password_hash, name, email, phone, active, created_at, updated_at, role_id) VALUES
(4, 'letan01', @pw, 'Phạm Thu Hà', 'letan01@vietskin.vn', '0901234568', 1, NOW(), NOW(), 3),
(5, 'letan02', @pw, 'Nguyễn Thị Hoa', 'letan02@vietskin.vn', '0901234575', 1, NOW(), NOW(), 3),
(6, 'letan03', @pw, 'Trần Văn Tú', 'letan03@vietskin.vn', '0901234576', 1, NOW(), NOW(), 3),
(7, 'letan04', @pw, 'Lê Thị Mai', 'letan04@vietskin.vn', '0901234577', 1, NOW(), NOW(), 3),
(8, 'letan05', @pw, 'Hoàng Văn Nam', 'letan05@vietskin.vn', '0901234578', 1, NOW(), NOW(), 3);

-- 4 Bác sĩ (SĐT: 0901234569, 0901234570, 0901234579, 0901234580)
INSERT INTO users (id, username, password_hash, name, email, phone, active, created_at, updated_at, role_id) VALUES
(9, 'bacsi01', @pw, 'BS. Nguyễn Văn A', 'bsa@vietskin.vn', '0901234569', 1, NOW(), NOW(), 2),
(10, 'bacsi02', @pw, 'BS. Trần Thị B', 'bsb@vietskin.vn', '0901234570', 1, NOW(), NOW(), 2),
(11, 'bacsi03', @pw, 'BS. Phạm Văn C', 'bsc@vietskin.vn', '0901234579', 1, NOW(), NOW(), 2),
(12, 'bacsi04', @pw, 'BS. Lê Thị D', 'bsd@vietskin.vn', '0901234580', 1, NOW(), NOW(), 2);

-- ── 3. DOCTORS ───────────────────────────────────────────────
INSERT INTO doctors (id, specialty, experience, degree, description, keywords, consultation_fee, active, created_at, user_id) VALUES
(1, 'Da liễu tổng quát', '10 năm', 'Thạc sĩ Y khoa', 'Chuyên khám mụn, dị ứng và da liễu tổng quát.', '["mụn", "tổng quát", "dị ứng"]', 150000.00, 1, NOW(), 9),
(2, 'Da liễu thẩm mỹ', '8 năm', 'Bác sĩ CKI', 'Chuyên điều trị mụn trứng cá, viêm da tiếp xúc và trẻ hóa da.', '["mụn", "viêm da", "thẩm mỹ"]', 200000.00, 1, NOW(), 10),
(3, 'Trị liệu viêm da & Dị ứng', '12 năm', 'Bác sĩ CKII', 'Chuyên sâu các bệnh lý viêm da cơ địa, dị ứng, mề đay.', '["viêm da", "dị ứng"]', 250000.00, 1, NOW(), 11),
(4, 'Laser & Thẩm mỹ da', '5 năm', 'Thạc sĩ - Bác sĩ', 'Chuyên điều trị sẹo, mụn và các bệnh ngoài da thường gặp.', '["mụn", "laser"]', 180000.00, 1, NOW(), 12);

-- ── 4. ROOMS ─────────────────────────────────────────────────
INSERT INTO rooms (id, name, active, created_at, doctor_id) VALUES
(1, 'Phòng khám 1', 1, NOW(), 1),
(2, 'Phòng khám 2', 1, NOW(), 2),
(3, 'Phòng khám 3', 1, NOW(), 3),
(4, 'Phòng khám 4', 1, NOW(), 4);

-- ── 5. PATIENTS (20 bệnh nhân) ───────────────────────────────
INSERT INTO users (id, username, password_hash, name, email, phone, active, created_at, updated_at, role_id) VALUES
(13, 'benhnhan01', @pw, 'Lê Văn C', 'lvc@gmail.com', '0901234571', 1, NOW(), NOW(), 4),
(14, 'benhnhan02', @pw, 'Nguyễn Thị D', 'ntd@gmail.com', '0901234572', 1, NOW(), NOW(), 4),
(15, 'benhnhan03', @pw, 'Trần Văn An', 'an.tv@gmail.com', '0931000001', 1, NOW(), NOW(), 4),
(16, 'benhnhan04', @pw, 'Phan Thị Bình', 'binh.pt@gmail.com', '0931000002', 1, NOW(), NOW(), 4),
(17, 'benhnhan05', @pw, 'Vũ Hoàng Giang', 'giang.vh@gmail.com', '0931000003', 1, NOW(), NOW(), 4),
(18, 'benhnhan06', @pw, 'Đặng Thị Hương', 'huong.dt@gmail.com', '0931000004', 1, NOW(), NOW(), 4),
(19, 'benhnhan07', @pw, 'Bùi Minh Hải', 'hai.bm@gmail.com', '0931000005', 1, NOW(), NOW(), 4),
(20, 'benhnhan08', @pw, 'Lâm Hoài Thu', 'thu.lh@gmail.com', '0931000006', 1, NOW(), NOW(), 4),
(21, 'benhnhan09', @pw, 'Đỗ Quốc Khánh', 'khanh.dq@gmail.com', '0931000007', 1, NOW(), NOW(), 4),
(22, 'benhnhan10', @pw, 'Ngô Gia Bảo', 'bao.ng@gmail.com', '0931000008', 1, NOW(), NOW(), 4),
(23, 'benhnhan11', @pw, 'Dương Trúc Quỳnh', 'quynh.dt@gmail.com', '0931000009', 1, NOW(), NOW(), 4),
(24, 'benhnhan12', @pw, 'Trần Minh Quân', 'quan.tm@gmail.com', '0931000010', 1, NOW(), NOW(), 4),
(25, 'benhnhan13', @pw, 'Phạm Ngọc Trâm', 'tram.pn@gmail.com', '0931000011', 1, NOW(), NOW(), 4),
(26, 'benhnhan14', @pw, 'Võ Văn Hùng', 'hung.vv@gmail.com', '0931000012', 1, NOW(), NOW(), 4),
(27, 'benhnhan15', @pw, 'Nguyễn Thanh Thảo', 'thao.nt@gmail.com', '0931000013', 1, NOW(), NOW(), 4),
(28, 'benhnhan16', @pw, 'Lý Minh Triết', 'triet.lm@gmail.com', '0931000014', 1, NOW(), NOW(), 4),
(29, 'benhnhan17', @pw, 'Mai Phương Thảo', 'thao.mp@gmail.com', '0931000015', 1, NOW(), NOW(), 4),
(30, 'benhnhan18', @pw, 'Đinh Tiến Dũng', 'dung.dt@gmail.com', '0931000016', 1, NOW(), NOW(), 4),
(31, 'benhnhan19', @pw, 'Tạ Mỹ Linh', 'linh.tm@gmail.com', '0931000017', 1, NOW(), NOW(), 4),
(32, 'benhnhan20', @pw, 'Phùng Xuân Trường', 'truong.px@gmail.com', '0931000018', 1, NOW(), NOW(), 4);

-- ── 6. PATIENT PROFILES ──────────────────────────────────────
INSERT INTO patient_profiles (id, patient_code, date_of_birth, gender, address, province, emergency_contact, created_at, updated_at, user_id) VALUES
(1, 'BN000001', '1995-05-15', 'male', '123 Đường ABC, Q.1', 'TP. Hồ Chí Minh', '0987654321', NOW(), NOW(), 13),
(2, 'BN000002', '1998-08-20', 'female', '456 Đường XYZ, Q.3', 'TP. Hồ Chí Minh', '0987654322', NOW(), NOW(), 14),
(3, 'BN000003', '1990-01-10', 'male', '789 Đường Láng', 'Hà Nội', '0912345671', NOW(), NOW(), 15),
(4, 'BN000004', '1992-02-12', 'female', '12 Phố Huế', 'Hà Nội', '0912345672', NOW(), NOW(), 16),
(5, 'BN000005', '1988-03-15', 'male', '45 Nguyễn Chí Thanh', 'Hà Nội', '0912345673', NOW(), NOW(), 17),
(6, 'BN000006', '1994-04-18', 'female', '88 Cầu Giấy', 'Hà Nội', '0912345674', NOW(), NOW(), 18),
(7, 'BN000007', '1996-05-20', 'male', '123 Lê Lợi', 'Đà Nẵng', '0912345675', NOW(), NOW(), 19),
(8, 'BN000008', '1991-06-25', 'female', '234 Trần Phú', 'Đà Nẵng', '0912345676', NOW(), NOW(), 20),
(9, 'BN000009', '1985-07-30', 'male', '345 Hùng Vương', 'Hải Phòng', '0912345677', NOW(), NOW(), 21),
(10, 'BN000010', '1999-08-14', 'male', '456 Lê Lai', 'Hải Phòng', '0912345678', NOW(), NOW(), 22),
(11, 'BN000011', '2001-09-09', 'female', '567 Lạch Tray', 'Hải Phòng', '0912345679', NOW(), NOW(), 23),
(12, 'BN000012', '1993-10-05', 'male', '678 Lê Hồng Phong', 'TP. Hồ Chí Minh', '0912345680', NOW(), NOW(), 24),
(13, 'BN000013', '1997-11-08', 'female', '789 Cách Mạng Tháng 8', 'TP. Hồ Chí Minh', '0912345681', NOW(), NOW(), 25),
(14, 'BN000014', '1990-12-12', 'male', '890 Ba Tháng Hai', 'TP. Hồ Chí Minh', '0912345682', NOW(), NOW(), 26),
(15, 'BN000015', '1995-01-20', 'female', '12 Nguyễn Trãi', 'TP. Hồ Chí Minh', '0912345683', NOW(), NOW(), 27),
(16, 'BN000016', '1987-02-25', 'male', '34 Nguyễn Thị Minh Khai', 'TP. Hồ Chí Minh', '0912345684', NOW(), NOW(), 28),
(17, 'BN000017', '2000-03-30', 'female', '56 Điện Biên Phủ', 'TP. Hồ Chí Minh', '0912345685', NOW(), NOW(), 29),
(18, 'BN000018', '1994-04-05', 'male', '78 Võ Thị Sáu', 'TP. Hồ Chí Minh', '0912345686', NOW(), NOW(), 30),
(19, 'BN000019', '1998-05-15', 'female', '90 Nam Kỳ Khởi Nghĩa', 'TP. Hồ Chí Minh', '0912345687', NOW(), NOW(), 31),
(20, 'BN000020', '1996-06-18', 'male', '12 Pasteur', 'TP. Hồ Chí Minh', '0912345688', NOW(), NOW(), 32);

-- ── 7. SERVICES (4 Danh mục, các dịch vụ cốt lõi) ────────────
-- 4 Danh mục: Khám thường, Điều trị chuyên sâu, Tư vấn da liễu, Xét nghiệm da
INSERT INTO services (id, name, description, price, duration, category, active, created_at, updated_at) VALUES
(1, 'Khám mụn', 'Chẩn đoán chuyên sâu các loại mụn, xây dựng phác đồ điều trị tận gốc.', 150000.00, 30, 'Khám thường', 1, NOW(), NOW()),
(2, 'Khám tổng quát', 'Thăm khám da liễu toàn diện, chẩn đoán các bệnh ngoài da thường gặp.', 150000.00, 30, 'Tư vấn da liễu', 1, NOW(), NOW()),
(3, 'Khám viêm da', 'Khám và điều trị chàm, vảy nến, viêm da cơ địa, viêm da tiếp xúc.', 200000.00, 30, 'Điều trị chuyên sâu', 1, NOW(), NOW()),
(4, 'Khám dị ứng', 'Xác định nguyên nhân và điều trị dị ứng da, mề đay, mẩn ngứa.', 200000.00, 30, 'Xét nghiệm da', 1, NOW(), NOW());

-- ── 8. MEDICINES (56 loại thuốc khác nhau) ────────────────────
INSERT INTO medicines (id, name, unit, category, description, active, created_at) VALUES
(1, 'Differin 0.1% gel', 'tuýp', 'Thuốc bôi', 'Điều trị mụn trứng cá', 1, NOW()),
(2, 'Azithromycin 500mg', 'viên', 'Kháng sinh', 'Kháng sinh nhóm macrolide', 1, NOW()),
(3, 'Isotretinoin 20mg', 'viên', 'Uống', 'Điều trị mụn nặng', 1, NOW()),
(4, 'Hydroquinone 4% cream', 'tuýp', 'Thuốc bôi', 'Điều trị nám da', 1, NOW()),
(5, 'Clobetasol 0.05% cream', 'tuýp', 'Corticoid', 'Điều trị viêm da cơ địa', 1, NOW()),
(6, 'Tretinoin 0.05% cream', 'tuýp', 'Thuốc bôi', 'Chống lão hóa, trị mụn', 1, NOW()),
(7, 'Ketoconazole 2% cream', 'tuýp', 'Thuốc bôi', 'Kháng nấm bôi ngoài da', 1, NOW()),
(8, 'Loratadine 10mg', 'viên', 'Kháng histamin', 'Điều trị dị ứng, ngứa', 1, NOW()),
(9, 'Fucidin 2% cream', 'tuýp', 'Thuốc bôi', 'Kháng sinh bôi ngoài da', 1, NOW()),
(10, 'Prednisolone 5mg', 'viên', 'Corticoid', 'Kháng viêm trị dị ứng', 1, NOW()),
(11, 'Benzoyl Peroxide 5% gel', 'tuýp', 'Thuốc bôi', 'Trị mụn sưng viêm', 1, NOW()),
(12, 'Adapalene 0.1% gel', 'tuýp', 'Thuốc bôi', 'Trị mụn trứng cá ẩn', 1, NOW()),
(13, 'Clindamycin 1% gel', 'tuýp', 'Thuốc bôi', 'Kháng sinh bôi trị mụn', 1, NOW()),
(14, 'Salicylic Acid 2% solution', 'lọ', 'Tẩy tế bào chết', 'Làm sạch lỗ chân lông', 1, NOW()),
(15, 'Klenzit MS', 'tuýp', 'Thuốc bôi', 'Trị mụn ẩn, mụn đầu đen', 1, NOW()),
(16, 'Klenzit C', 'tuýp', 'Thuốc bôi', 'Trị mụn viêm, mụn mủ', 1, NOW()),
(17, 'Derma Forte', 'tuýp', 'Thuốc bôi', 'Trị thâm mụn, ngừa mụn', 1, NOW()),
(18, 'Megaduo', 'tuýp', 'Thuốc bôi', 'Giảm mụn, mờ thâm', 1, NOW()),
(19, 'Eucerin ProAcne', 'lọ', 'Chăm sóc da', 'Tinh chất giảm mụn', 1, NOW()),
(20, 'Laroche Posay Duo+', 'tuýp', 'Chăm sóc da', 'Giảm mụn ngừa thâm', 1, NOW()),
(21, 'Decumar gel', 'tuýp', 'Chăm sóc da', 'Trị mụn thâm từ nghệ', 1, NOW()),
(22, 'Acnes Sealing Gel', 'tuýp', 'Thuốc bôi', 'Trị mụn sưng đỏ', 1, NOW()),
(23, 'Erythromycin 250mg', 'viên', 'Kháng sinh', 'Điều trị nhiễm khuẩn da', 1, NOW()),
(24, 'Doxycycline 100mg', 'viên', 'Kháng sinh', 'Trị mụn viêm nặng', 1, NOW()),
(25, 'Tetracycline 1%', 'tuýp', 'Thuốc bôi', 'Mỡ kháng sinh bôi da', 1, NOW()),
(26, 'Fucicort', 'tuýp', 'Corticoid', 'Trị viêm da nhiễm khuẩn', 1, NOW()),
(27, 'Gentrisone', 'tuýp', 'Corticoid', 'Trị ngứa, nấm, viêm da', 1, NOW()),
(28, 'Dibetalic', 'tuýp', 'Corticoid', 'Trị vảy nến, á sừng', 1, NOW()),
(29, 'Skinoren 20% cream', 'tuýp', 'Thuốc bôi', 'Trị mụn, trị thâm', 1, NOW()),
(30, 'Obagi Tretinoin 0.025%', 'tuýp', 'Thuốc bôi', 'Trẻ hóa da, trị mụn', 1, NOW()),
(31, 'Cetirizine 10mg', 'viên', 'Kháng histamin', 'Trị ngứa dị ứng', 1, NOW()),
(32, 'Fexofenadine 180mg', 'viên', 'Kháng histamin', 'Trị mề đay dị ứng', 1, NOW()),
(33, 'Desloratadine 5mg', 'viên', 'Kháng histamin', 'Trị viêm mũi dị ứng và ngứa', 1, NOW()),
(34, 'Medrol 4mg', 'viên', 'Corticoid', 'Kháng viêm mạnh', 1, NOW()),
(35, 'Dexamethasone 0.5mg', 'viên', 'Corticoid', 'Kháng viêm dị ứng', 1, NOW()),
(36, 'Bepanthen cream', 'tuýp', 'Phục hồi da', 'Trị hăm, khô da, nứt nẻ', 1, NOW()),
(37, 'Cicaplast Baume B5', 'tuýp', 'Phục hồi da', 'Làm dịu da kích ứng', 1, NOW()),
(38, 'Avene Cicalfate', 'tuýp', 'Phục hồi da', 'Kháng khuẩn phục hồi da', 1, NOW()),
(39, 'Bio-essence B5', 'lọ', 'Chăm sóc da', 'Tinh chất cấp ẩm phục hồi', 1, NOW()),
(40, 'Obagi Clinical Kinetin', 'lọ', 'Chăm sóc da', 'Kem dưỡng phục hồi da nhạy cảm', 1, NOW()),
(41, 'Zinc Oxide 10%', 'tuýp', 'Thuốc bôi', 'Dịu da sát khuẩn nhẹ', 1, NOW()),
(42, 'Contractubex', 'tuýp', 'Trị sẹo', 'Trị sẹo lồi, sẹo phì đại', 1, NOW()),
(43, 'Dermatix Ultra', 'tuýp', 'Trị sẹo', 'Làm mờ sẹo thâm, sẹo lồi', 1, NOW()),
(44, 'Hiruscar', 'tuýp', 'Trị sẹo', 'Giảm thâm mụn, sẹo lõm', 1, NOW()),
(45, 'Acyclovir 400mg', 'viên', 'Kháng virus', 'Trị Zona, thủy đậu, Herpes', 1, NOW()),
(46, 'Acyclovir 5% cream', 'tuýp', 'Thuốc bôi', 'Bôi ngứa mụn nước Herpes', 1, NOW()),
(47, 'Terbinafine 250mg', 'viên', 'Kháng nấm', 'Trị nấm móng, nấm da toàn thân', 1, NOW()),
(48, 'Itraconazole 100mg', 'viên', 'Kháng nấm', 'Điều trị nấm Candida, nấm da', 1, NOW()),
(49, 'Nizoral cream', 'tuýp', 'Thuốc bôi', 'Trị nấm ngứa ngoài da', 1, NOW()),
(50, 'Canesten', 'tuýp', 'Thuốc bôi', 'Trị nấm kẽ chân, nấm bẹn', 1, NOW()),
(51, 'Tacrolimus 0.03%', 'tuýp', 'Thuốc bôi', 'Ức chế miễn dịch trị viêm da', 1, NOW()),
(52, 'Elidel 1% cream', 'tuýp', 'Thuốc bôi', 'Trị viêm da cơ địa không chứa corticoid', 1, NOW()),
(53, 'Sodermix', 'tuýp', 'Chăm sóc da', 'Giảm ngứa, trị sẹo lồi', 1, NOW()),
(54, 'Cerave Moisturizing Cream', 'hũ', 'Chăm sóc da', 'Kem dưỡng ẩm phục hồi màng bảo vệ da', 1, NOW()),
(55, 'Cetaphil Moisturizing Lotion', 'lọ', 'Chăm sóc da', 'Sữa dưỡng ẩm dịu nhẹ toàn thân', 1, NOW()),
(56, 'Physiogel Calming Relief', 'lọ', 'Chăm sóc da', 'Làm dịu da khô nhạy cảm kích ứng', 1, NOW());

-- ── 9. DOCTOR WORK DAYS (T2→T7 trong 30 ngày tới cho 4 BS) ──
INSERT INTO doctor_work_days (doctor_id, room_id, date, created_at)
WITH RECURSIVE dates(d, dt) AS (
    SELECT 0, CURDATE()
    UNION ALL
    SELECT d + 1, DATE_ADD(CURDATE(), INTERVAL d + 1 DAY)
    FROM dates
    WHERE d < 30
)
SELECT ELT(r.n, 1, 2, 3, 4) AS doctor_id,
       ELT(r.n, 1, 2, 3, 4) AS room_id,
       dt,
       NOW()
FROM dates
CROSS JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) r
WHERE DAYOFWEEK(dt) <> 1; -- Bỏ chủ nhật

-- ── 10. APPOINTMENTS (Mẫu cuộc hẹn hoạt động) ─────────────────
INSERT INTO appointments (id, patient_name, patient_phone, patient_email, time, date, status, symptoms, queue_number, created_at, updated_at, patient_id, doctor_id, service_id) VALUES
(1, 'Lê Văn C', '0901234571', 'lvc@gmail.com', '09:00', CURDATE(), 'done', 'Mụn viêm nhiều ở trán', 1, NOW(), NOW(), 13, 1, 1),
(2, 'Nguyễn Thị D', '0901234572', 'ntd@gmail.com', '10:00', CURDATE(), 'confirmed', 'Nám hai bên má', 2, NOW(), NOW(), 14, 2, 2),
(3, 'Trần Văn An', '0931000001', 'an.tv@gmail.com', '11:00', CURDATE(), 'checked_in', 'Viêm da tiếp xúc cơ địa', 3, NOW(), NOW(), 15, 3, 3),
(4, 'Phan Thị Bình', '0931000002', 'binh.pt@gmail.com', '14:00', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'pending', 'Dị ứng nổi mẩn ngứa', NULL, NOW(), NOW(), 16, 4, 4);

-- ── 11. INVOICES (Mẫu hóa đơn thanh toán) ────────────────────
INSERT INTO invoices (id, invoice_code, patient_name, description, amount, status, method, paid_at, note, created_at, updated_at, appointment_id, patient_id, received_by) VALUES
(1, 'INV-2026-0001', 'Lê Văn C', 'Phí khám mụn - BS. Nguyễn Văn A', 150000.00, 'paid', 'cash', NOW(), 'Thanh toán tiền mặt', NOW(), NOW(), 1, 13, 4),
(2, 'INV-2026-0002', 'Trần Văn An', 'Phí khám viêm da - BS. Phạm Văn C', 200000.00, 'paid', 'qr_code', NOW(), 'Thanh toán chuyển khoản', NOW(), NOW(), 3, 15, 4);

-- ── 12. MEDICAL RECORDS & PRESCRIPTIONS ──────────────────────
INSERT INTO medical_records (id, symptoms, skin_type, lesion_location, diagnosis, treatment, note, follow_up_date, created_at, updated_at, appointment_id, patient_id, doctor_id) VALUES
(1, 'Mụn viêm nhiều ở trán, da dầu', 'da dầu', 'trán, má', 'Mụn trứng cá mức độ nhẹ', 'Bôi Differin 0.1% gel', 'Ăn nhiều rau xanh, hạn chế đồ ngọt', DATE_ADD(CURDATE(), INTERVAL 14 DAY), NOW(), NOW(), 1, 13, 1);

INSERT INTO prescriptions (id, note, created_at, appointment_id, medical_record_id) VALUES
(1, 'Bôi thuốc mụn sau khi làm sạch da vào buổi tối', NOW(), 1, 1);

INSERT INTO prescription_items (prescription_id, medicine_id, medicine_name, dosage, frequency, duration, quantity, note) VALUES
(1, 1, 'Differin 0.1% gel', 'Bôi lớp mỏng', '1 lần/ngày', '30 ngày', 1, 'Tránh vùng quanh mắt');

-- ── 13. NOTIFICATIONS ────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES
(13, 'appointment', 'Lịch hẹn đã được xác nhận', 'Lịch khám hôm nay lúc 09:00 với BS. Nguyễn Văn A đã được xác nhận.', 1, NOW()),
(14, 'reminder', 'Nhắc nhở lịch khám', 'Bạn có lịch khám hôm nay lúc 10:00 với BS. Trần Thị B. Vui lòng đến đúng giờ.', 0, NOW());
