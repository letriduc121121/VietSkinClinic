import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Chuyển URL ảnh thành src hiển thị.
 * - URL đã full (Cloudinary) → dùng thẳng
 * - URL path local (/uploads/...) → nối với backend
 */
// Gốc backend (bỏ phần "/api" ở cuối VITE_API_URL), vd http://167.71.17.113:8080
const BACKEND_ORIGIN = (
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080/api'
).replace(/\/api\/?$/, '');

export const imgSrc = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

/**
 * Nén ảnh bằng Canvas trước khi upload.
 * Chuyển tất cả về định dạng JPEG, chất lượng 0.8, và giới hạn kích thước tối đa 1600px.
 */
export function compressImage(file: File, quality = 0.8, maxDimension = 1600): Promise<File> {
  return new Promise((resolve) => {
    // Không nén các file không phải là ảnh
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    
    // Nếu là ảnh GIF (có thể động), không nén để tránh mất động
    if (file.type === 'image/gif') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Giới hạn chiều dài/rộng tối đa
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file); // Fallback nếu lỗi load ảnh
    };
    reader.onerror = () => resolve(file); // Fallback nếu lỗi đọc file
  });
}

