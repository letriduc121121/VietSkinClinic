import type { MedicalRecordImage } from '@/features/medical-record-images/types/medical-record-image.types';

export interface PrescriptionItem {
  id?: number;
  medicineName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: number | null;
  note?: string | null;
}

export interface Prescription {
  id: number;
  note?: string | null;
  createdAt?: string;
  items: PrescriptionItem[];
}

export interface MedicalRecord {
  id: number;
  symptoms?: string | null;
  skinType?: string | null;
  lesionLocation?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  note?: string | null;
  followUpDate?: string | null;
  createdAt: string;
  doctor?: { user: { name: string; avatar?: string | null } } | null;
  appointment?: {
    id?: number;
    date: string;
    time?: string;
    patientName?: string;
    service?: { name: string } | null;
  } | null;
  /** Nhiều đơn thuốc / 1 lần khám */
  prescriptions?: Prescription[];
  /** Ảnh tổn thương da */
  images?: MedicalRecordImage[];
}

export interface CreateMedicalRecordDto {
  appointmentId: number;
  symptoms?: string;
  skinType?: string;
  lesionLocation?: string;
  diagnosis?: string;
  treatment?: string;
  note?: string;
  followUpDate?: string;
}

export interface UpdateMedicalRecordDto extends Partial<CreateMedicalRecordDto> {}
