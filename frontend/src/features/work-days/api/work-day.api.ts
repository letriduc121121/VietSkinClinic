import api from '@/shared/lib/axios';
import type { WorkDay, CreateWorkDayDto, BulkCreateWorkDayDto } from '../types/work-day.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const workDayApi = {
  /** Lấy danh sách ngày làm việc (filter theo tháng, bác sĩ) */
  getAll: (params?: { month?: string; doctorId?: number }): Promise<WorkDay[]> =>
    api.get('/doctor-work-days', { params }).then(unwrap),

  /** Bác sĩ — lấy lịch làm việc của chính mình theo tháng (YYYY-MM) */
  getMine: (month: string): Promise<WorkDay[]> =>
    api.get('/doctor-work-days/my', { params: { month } }).then(unwrap),

  /** Tạo 1 ngày làm việc */
  create: (dto: CreateWorkDayDto): Promise<WorkDay> =>
    api.post('/doctor-work-days', dto).then(unwrap),

  /** Tạo nhiều ngày làm việc cùng lúc */
  bulkCreate: (dto: BulkCreateWorkDayDto): Promise<WorkDay[]> =>
    api.post('/doctor-work-days/bulk', dto).then(unwrap),

  /** Xoá 1 ngày làm việc */
  delete: (id: number): Promise<void> =>
    api.delete(`/doctor-work-days/${id}`).then(unwrap),
};
