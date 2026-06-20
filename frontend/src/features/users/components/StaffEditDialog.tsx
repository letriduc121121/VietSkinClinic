import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/components/Modal';
import { Alert } from '@/shared/components/Alert';
import type { StaffEditForm, UserRecord } from '../types/user.types';
import { AvatarUpload } from './AvatarUpload';
import { DoctorProfileFields, inputCls } from './staffFields';

interface Specialty { id: number; name: string }
interface Degree { id: number; name: string }

interface Props {
  target: UserRecord;
  specialties: Specialty[];
  degrees: Degree[];
  onClose: () => void;
  onUpdate: (target: UserRecord, form: StaffEditForm) => Promise<void>;
}

const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

const toForm = (u: UserRecord, specialties: Specialty[], degrees: Degree[]): StaffEditForm => {
  const dp = u.doctorProfile;
  const spInList = specialties.some(s => s.name === dp?.specialty);
  const degInList = degrees.some(d => d.name === dp?.degree);
  return {
    name: u.name,
    email: u.email ?? '',
    avatar: u.avatar ?? '',
    specialty: spInList ? (dp?.specialty ?? '') : (dp?.specialty ? '__other__' : ''),
    specialtyCustom: spInList ? '' : (dp?.specialty ?? ''),
    degree: degInList ? (dp?.degree ?? '') : (dp?.degree ? '__other__' : ''),
    degreeCustom: degInList ? '' : (dp?.degree ?? ''),
    experience: dp?.experience ?? '',
    consultationFee: dp?.consultationFee != null ? String(dp.consultationFee) : '',
    description: dp?.description ?? '',
  };
};

export function StaffEditDialog({ target, specialties, degrees, onClose, onUpdate }: Props) {
  const [form, setForm] = useState<StaffEditForm>(() => toForm(target, specialties, degrees));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = (patch: Partial<StaffEditForm>) => setForm(f => ({ ...f, ...patch }));

  const submit = async () => {
    setSaving(true); setError('');
    try {
      await onUpdate(target, form);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Không thể cập nhật.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal maxWidth="max-w-lg">
      <ModalHeader onClose={onClose}>
        <div>
          <h3 className="font-bold text-gray-900">Chỉnh sửa — {target.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{target.phone}</p>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <AvatarUpload value={form.avatar} onChange={url => change({ avatar: url })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Họ tên *</label>
            <input type="text" value={form.name} onChange={e => change({ name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Số điện thoại</label>
            <input type="text" value={target.phone} readOnly className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} placeholder="example@email.com" onChange={e => change({ email: e.target.value })} className={inputCls} />
          </div>
        </div>

        {target.role?.code === 'doctor' && (
          <DoctorProfileFields values={form} onChange={change} specialties={specialties} degrees={degrees} />
        )}

        {error && <Alert variant="error">{error}</Alert>}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
        <button onClick={submit} disabled={saving} className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
