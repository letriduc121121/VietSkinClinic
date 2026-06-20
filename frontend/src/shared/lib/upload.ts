import api from './axios';
import { compressImage } from './utils';

export type UploadFolder =
  | 'vietskin/avatars'
  | 'vietskin/services'
  | 'vietskin/lab-results';

/** Upload 1 file lên server, trả về URL string, hỗ trợ theo dõi tiến trình */
export async function uploadFile(
  file: File, 
  folder: UploadFolder,
  onProgress?: (percent: number) => void
): Promise<string> {
  let fileToUpload = file;
  try {
    fileToUpload = await compressImage(file);
  } catch (e) {
    console.error('Lỗi khi nén ảnh, tải lên file gốc:', e);
  }

  const fd = new FormData();
  fd.append('file', fileToUpload);
  const res = await api.post(`/upload?folder=${folder}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
  const data = res.data?.data ?? res.data;
  // Backend trả { url, publicId } — lấy field url
  return (data?.url ?? data) as string;
}
