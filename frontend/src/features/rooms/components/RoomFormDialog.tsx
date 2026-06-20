import { useState } from 'react';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/components/Modal';
import { Alert } from '@/shared/components/Alert';
import type { Room, RoomForm } from '../types/room.types';
import { emptyRoomForm } from '../lib/room';

interface Props {
  target: Room | null;
  doctors: Doctor[];
  assignedDoctorIds: number[];
  onClose: () => void;
  onCreate: (form: RoomForm) => Promise<void>;
  onUpdate: (id: number, form: RoomForm) => Promise<void>;
}

export function RoomFormDialog({ target, doctors, assignedDoctorIds, onClose, onCreate, onUpdate }: Props) {
  const editing = !!target;
  const [form, setForm] = useState<RoomForm>(target ? { name: target.name, doctorId: target.doctorId ? String(target.doctorId) : '' } : emptyRoomForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      if (target) await onUpdate(target.id, form);
      else await onCreate(form);
      setSuccess(editing ? 'Đã cập nhật phòng!' : 'Đã thêm phòng!');
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể lưu phòng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal maxWidth="max-w-sm">
      <ModalHeader onClose={onClose}>
        <h3 className="font-bold text-lg">{editing ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h3>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên phòng *</label>
          <input
            type="text" autoFocus value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Phòng 1, Phòng Da liễu..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bác sĩ phụ trách</label>
          <select
            value={form.doctorId}
            onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] bg-white"
          >
            <option value="">-- Chưa gán --</option>
            {doctors.filter(d => !assignedDoctorIds.includes(d.id)).map(d => (
              <option key={d.id} value={d.id}>{d.user?.name ?? `BS #${d.id}`}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Mỗi phòng chỉ gán 1 bác sĩ. Bác sĩ đã có phòng sẽ không hiển thị.</p>
        </div>

        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Huỷ</button>
        <button onClick={submit} disabled={saving || !form.name.trim()} className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
          {saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Thêm phòng'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
