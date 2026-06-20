export interface PatientProfile {
  patientCode?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  bloodType?: string | null;
  ethnicity?: string | null;
  citizenId?: string | null;
  emergencyContact?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
}

export interface DoctorProfile {
  id: number;
  specialty?: string | null;
  degree?: string | null;
  experience?: string | null;
  consultationFee?: number | null;
  description?: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  role: { code: string; name: string };
  patientProfile?: PatientProfile | null;
}

export interface UserRecord {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  active: boolean;
  createdAt?: string;
  role: { code: string; name: string };
  doctorProfile?: DoctorProfile | null;
  patientProfile?: PatientProfile | null;
}

export interface CreateStaffDto {
  name: string;
  phone: string;
  email?: string;
  password: string;
  roleCode: 'doctor' | 'receptionist' | 'admin';
  avatar?: string;
  specialty?: string;
  degree?: string;
  experience?: string;
  consultationFee?: string;
  description?: string;
}

export type StaffRole = 'doctor' | 'receptionist' | 'admin';

export interface PatientFormValues {
  name: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  ethnicity: string;
  citizenId: string;
  emergencyContact: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  allergies: string;
  medicalHistory: string;
}

export interface StaffCreateForm {
  name: string; phone: string; email: string; password: string;
  roleCode: StaffRole; avatar: string;
  specialty: string; specialtyCustom: string;
  degree: string; degreeCustom: string;
  experience: string; consultationFee: string; description: string;
}

export interface StaffEditForm {
  name: string; email: string; avatar: string;
  specialty: string; specialtyCustom: string;
  degree: string; degreeCustom: string;
  experience: string; consultationFee: string; description: string;
}
