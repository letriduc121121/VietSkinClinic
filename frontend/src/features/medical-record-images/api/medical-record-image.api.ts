import api from '@/shared/lib/axios';
import { compressImage } from '@/shared/lib/utils';
import type { MedicalRecordImage } from '../types/medical-record-image.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const medicalRecordImageApi = {
  /** Upload 1 ảnh tổn thương da lên Cloudinary (multipart/form-data) */
  upload: async (
    medicalRecordId: number, 
    file: File, 
    note?: string,
    onProgress?: (percent: number) => void
  ): Promise<MedicalRecordImage> => {
    let fileToUpload = file;
    try {
      fileToUpload = await compressImage(file);
    } catch (e) {
      console.error('Lỗi khi nén ảnh bệnh án, tải lên file gốc:', e);
    }

    const fd = new FormData();
    fd.append('file', fileToUpload);
    fd.append('medicalRecordId', String(medicalRecordId));
    if (note?.trim()) fd.append('note', note.trim());
    return api.post('/medical-record-images/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    }).then(unwrap);
  },

  /** Lấy toàn bộ ảnh của 1 bệnh án */
  getByRecord: (medicalRecordId: number): Promise<MedicalRecordImage[]> =>
    api.get('/medical-record-images', { params: { medicalRecordId } }).then(unwrap),

  /** Xoá ảnh (xoá cả trên Cloudinary) */
  delete: (id: number): Promise<void> =>
    api.delete(`/medical-record-images/${id}`).then(unwrap),
};
