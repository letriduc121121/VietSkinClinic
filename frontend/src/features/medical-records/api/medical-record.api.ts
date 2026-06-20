import api from '@/shared/lib/axios';
import type { MedicalRecord, CreateMedicalRecordDto, UpdateMedicalRecordDto } from '../types/medical-record.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const medicalRecordApi = {
  /** Hồ sơ bệnh án của bệnh nhân đang đăng nhập */
  getMy: (): Promise<MedicalRecord[]> =>
    api.get('/medical-records/my').then(unwrap),

  /** Chi tiết 1 hồ sơ (bao gồm prescription) */
  getById: (id: number): Promise<MedicalRecord> =>
    api.get(`/medical-records/${id}`).then(unwrap),

  /** Lịch sử bệnh án của 1 bệnh nhân cụ thể */
  getByPatient: (patientId: number): Promise<MedicalRecord[]> =>
    api.get(`/medical-records/patient/${patientId}`).then(unwrap),

  /** Hồ sơ theo appointmentId — null nếu chưa lập bệnh án */
  getByAppointment: (appointmentId: number): Promise<MedicalRecord | null> =>
    api.get('/medical-records', { params: { appointmentId } }).then((res) => {
      const d = res.data?.data ?? null;
      return d && d.id ? (d as MedicalRecord) : null;
    }),

  /** Tạo hồ sơ bệnh án mới */
  create: (dto: CreateMedicalRecordDto): Promise<MedicalRecord> =>
    api.post('/medical-records', dto).then(unwrap),

  /** Cập nhật hồ sơ bệnh án */
  update: (id: number, dto: UpdateMedicalRecordDto): Promise<MedicalRecord> =>
    api.put(`/medical-records/${id}`, dto).then(unwrap),
};
