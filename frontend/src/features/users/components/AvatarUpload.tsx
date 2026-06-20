import { useState } from 'react';
import { imgSrc } from '@/shared/lib/utils';
import { uploadFile } from '@/shared/lib/upload';

export function AvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      onChange(await uploadFile(file, 'vietskin/avatars', (percent) => setProgress(percent)));
    } catch { /* silent */ } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ảnh đại diện</label>
      <div className="flex items-center gap-4">
        {value ? (
          <img src={imgSrc(value)!} alt="ảnh đại diện" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <label className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? `Đang tải... (${progress ?? 0}%)` : 'Chọn ảnh'}
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-700">Xoá</button>
        )}
      </div>
    </div>
  );
}
