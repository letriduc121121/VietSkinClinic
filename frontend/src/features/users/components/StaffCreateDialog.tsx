import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/components/Modal';
import { Alert } from '@/shared/components/Alert';
import type { StaffCreateForm, StaffRole } from '../types/user.types';
import { emptyStaffCreate } from '../lib/staff';
import { AvatarUpload } from './AvatarUpload';
import { DoctorProfileFields, inputCls } from './staffFields';

interface Specialty { id: number; name: string }
interface Degree { id: number; name: string }

interface Props {
  specialties: Specialty[];
  degrees: Degree[];
  onClose: () => void;
  onCreate: (form: StaffCreateForm) => Promise<void>;
}

const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

export function StaffCreateDialog({ specialties, degrees, onClose, onCreate }: Props) {
  const [form, setForm] = useState<StaffCreateForm>(emptyStaffCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = (patch: Partial<StaffCreateForm>) => setForm(f => ({ ...f, ...patch }));

  const canSubmit = !!form.name.trim() && !!form.phone.trim() && !!form.password.trim();

  const submit = async () => {
    setSaving(true); setError('');
    try {
      await onCreate(form);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Không thể tạo nhân sự.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal maxWidth="max-w-lg">
      <ModalHeader onClose={onClose}>
        <div>
          <h3 className="font-bold text-gray-900">Thêm nhân sự mới</h3>
          <p className="text-xs text-gray-400 mt-0.5">Điền đầy đủ thông tin bên dưới</p>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <AvatarUpload value={form.avatar} onChange={url => change({ avatar: url })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Họ tên *</label>
            <input type="text" value={form.name} placeholder="Nguyễn Văn A" onChange={e => change({ name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Số điện thoại *</label>
            <input type="text" value={form.phone} placeholder="09xxxxxxxx" onChange={e => change({ phone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} placeholder="example@email.com" onChange={e => change({ email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mật khẩu *</label>
            <input type="text" value={form.password} onChange={e => change({ password: e.target.value })} className={inputCls + ' font-mono'} />
          </div>
          <div>
            <label className={labelCls}>Vai trò *</label>
            <select value={form.roleCode} onChange={e => change({ roleCode: e.target.value as StaffRole })} className={inputCls + ' bg-white'}>
              <option value="doctor">Bác sĩ</option>
              <option value="receptionist">Lễ tân</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>

        {form.roleCode === 'doctor' && (
          <DoctorProfileFields values={form} onChange={change} specialties={specialties} degrees={degrees} />
        )}

        {error && <Alert variant="error">{error}</Alert>}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Huỷ</button>
        <button onClick={submit} disabled={saving || !canSubmit} className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
          {saving ? 'Đang tạo...' : 'Tạo nhân sự'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
