import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/components/Modal';
import { Alert } from '@/shared/components/Alert';
import type { Medicine, MedicineForm } from '../types/medicine.types';
import { emptyMedicineForm } from '../lib/medicine';

interface Props {
  target: Medicine | null;
  categories: string[];
  units: string[];
  onClose: () => void;
  onCreate: (form: MedicineForm) => Promise<void>;
  onUpdate: (id: number, form: MedicineForm) => Promise<void>;
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

const toForm = (m: Medicine): MedicineForm => ({
  name: m.name, unit: m.unit ?? '', category: m.category ?? '', description: m.description ?? '',
});

export function MedicineFormDialog({ target, categories, units, onClose, onCreate, onUpdate }: Props) {
  const editing = !!target;
  const [form, setForm] = useState<MedicineForm>(target ? toForm(target) : emptyMedicineForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const set = (k: keyof MedicineForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setError('Tên thuốc không được để trống.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      if (target) await onUpdate(target.id, form);
      else await onCreate(form);
      setSuccess(editing ? 'Cập nhật thuốc thành công!' : 'Thêm thuốc mới thành công!');
      setTimeout(onClose, 1200);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể lưu thông tin thuốc.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal maxWidth="max-w-md">
      <ModalHeader onClose={onClose}>
        <h3 className="font-bold text-lg text-gray-900">{editing ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}</h3>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <div>
          <label className={labelCls}>Tên thuốc *</label>
          <input type="text" className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ví dụ: Paracetamol 500mg, Differin..." autoFocus />
        </div>
        <div>
          <label className={labelCls}>Đơn vị tính</label>
          <input type="text" list="med-units" className={inputCls} value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="Ví dụ: viên, tuýp, vỉ, chai..." />
          <datalist id="med-units">{units.map(u => <option key={u} value={u} />)}</datalist>
        </div>
        <div>
          <label className={labelCls}>Nhóm danh mục</label>
          <input type="text" list="med-categories" className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} placeholder="Ví dụ: Kháng sinh, Thuốc bôi, Corticoid..." />
          <datalist id="med-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className={labelCls}>Mô tả chi tiết</label>
          <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mô tả tác dụng phụ, cách dùng hoặc lưu ý..." />
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Huỷ</button>
        <button onClick={submit} disabled={saving || !form.name.trim()} className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
          {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm mới'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
