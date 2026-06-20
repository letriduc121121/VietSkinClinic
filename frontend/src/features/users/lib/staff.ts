import type { StaffCreateForm, StaffEditForm, StaffRole } from '../types/user.types';

export const roleLabel: Record<StaffRole, string> = {
  doctor: 'Bác sĩ', receptionist: 'Lễ tân', admin: 'Quản trị viên',
};

export const STAFF_ROLES: StaffRole[] = ['doctor', 'receptionist', 'admin'];

export const emptyStaffCreate: StaffCreateForm = {
  name: '', phone: '', email: '', password: 'Vietskin@123',
  roleCode: 'doctor', avatar: '',
  specialty: '', specialtyCustom: '',
  degree: '', degreeCustom: '',
  experience: '', consultationFee: '', description: '',
};

export const emptyStaffEdit: StaffEditForm = {
  name: '', email: '', avatar: '',
  specialty: '', specialtyCustom: '',
  degree: '', degreeCustom: '',
  experience: '', consultationFee: '', description: '',
};

/** Chọn giá trị thực: nếu chọn "Khác" thì lấy ô nhập tay */
export const resolveCustom = (value: string, custom: string) =>
  value === '__other__' ? custom : value;
