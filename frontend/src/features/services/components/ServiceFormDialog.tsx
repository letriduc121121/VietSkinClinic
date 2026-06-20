import { useState } from 'react';
import { imgSrc } from '@/shared/lib/utils';
import { uploadFile } from '@/shared/lib/upload';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/components/Modal';
import { Alert } from '@/shared/components/Alert';
import type { Service, ServiceForm } from '../types/service.types';
import { emptyServiceForm } from '../lib/service';

interface Props {
  target: Service | null;
  categories: string[];
  onClose: () => void;
  onCreate: (form: ServiceForm) => Promise<void>;
  onUpdate: (id: number, form: ServiceForm) => Promise<void>;
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

const toForm = (s: Service): ServiceForm => ({
  name: s.name,
  description: s.description ?? '',
  price: String(s.price),
  duration: String(s.duration),
  category: s.category ?? '',
  imageUrl: s.imageUrl ?? '',
  active: s.active ?? true,
});

export function ServiceFormDialog({ target, categories, onClose, onCreate, onUpdate }: Props) {
  const editing = !!target;
  const [form, setForm] = useState<ServiceForm>(target ? toForm(target) : emptyServiceForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const set = (k: keyof ServiceForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const uploadImage = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      set('imageUrl', await uploadFile(file, 'vietskin/services', (percent) => setUploadProgress(percent)));
    } catch {
      setError('Không thể upload ảnh.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true); setError('');
    try {
      if (target) await onUpdate(target.id, form);
      else await onCreate(form);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể lưu dịch vụ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal maxWidth="max-w-lg">
      <ModalHeader onClose={onClose}>
        <h3 className="font-bold text-lg text-gray-900">{editing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <div>
          <label className={labelCls}>Ảnh dịch vụ</label>
          <div className="flex items-center gap-4">
            {form.imageUrl ? (
              <img src={imgSrc(form.imageUrl)!} alt="preview" className="w-24 h-20 object-cover rounded-xl border border-gray-200" />
            ) : (
              <div className="w-24 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? `Đang tải... (${uploadProgress ?? 0}%)` : 'Chọn ảnh'}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => set('imageUrl', '')} className="text-xs text-red-500 hover:text-red-700 text-center">Xoá ảnh</button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Tên dịch vụ *</label>
          <input type="text" className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Khám da tổng quát" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Giá (VNĐ) *</label>
            <input type="number" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} placeholder="150000" min={0} />
          </div>
          <div>
            <label className={labelCls}>Thời gian (phút)</label>
            <input type="number" className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="30" min={5} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Danh mục</label>
          <input type="text" list="svc-categories" className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} placeholder="Khám thường, Thẩm mỹ..." />
          <datalist id="svc-categories">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea rows={2} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mô tả ngắn về dịch vụ..." />
        </div>

        {error && <Alert variant="error">{error}</Alert>}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Huỷ</button>
        <button onClick={submit} disabled={saving || !form.name.trim() || !form.price} className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
          {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
