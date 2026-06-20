import { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/components/Modal';
import { Alert } from '@/shared/components/Alert';
import type { PatientFormValues, UserRecord } from '../types/user.types';
import { emptyPatientForm } from '../lib/patient';
import { PatientFormFields } from './PatientFormFields';

interface Props {
  target: UserRecord | null;
  getFull: (id: number) => Promise<UserRecord>;
  onClose: () => void;
  onCreate: (values: PatientFormValues & { phone: string }) => Promise<void>;
  onUpdate: (id: number, values: PatientFormValues) => Promise<void>;
}

const toForm = (u: UserRecord): PatientFormValues => {
  const pp = u.patientProfile;
  return {
    name: u.name,
    email: u.email ?? '',
    dateOfBirth: pp?.dateOfBirth ? pp.dateOfBirth.slice(0, 10) : '',
    gender: pp?.gender ?? '',
    bloodType: pp?.bloodType ?? '',
    ethnicity: pp?.ethnicity ?? '',
    citizenId: pp?.citizenId ?? '',
    emergencyContact: pp?.emergencyContact ?? '',
    address: pp?.address ?? '',
    ward: pp?.ward ?? '',
    district: pp?.district ?? '',
    province: pp?.province ?? '',
    allergies: pp?.allergies ?? '',
    medicalHistory: pp?.medicalHistory ?? '',
  };
};

export function PatientFormDialog({ target, getFull, onClose, onCreate, onUpdate }: Props) {
  const isCreate = !target;
  const [values, setValues] = useState<PatientFormValues>(emptyPatientForm);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    if (target.patientProfile === undefined) {
      setLoading(true);
      getFull(target.id).then(full => setValues(toForm(full))).catch(() => setValues(toForm(target))).finally(() => setLoading(false));
    } else {
      setValues(toForm(target));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (patch: Partial<PatientFormValues>) => setValues(v => ({ ...v, ...patch }));

  const canSubmit = isCreate
    ? !!values.name.trim() && !!phone.trim()
    : !!values.name.trim();

  const submit = async () => {
    setSaving(true); setError('');
    try {
      if (isCreate) await onCreate({ ...values, phone });
      else await onUpdate(target!.id, values);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? (isCreate ? 'Không thể tạo hồ sơ bệnh nhân.' : 'Không thể cập nhật thông tin.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal>
      <ModalHeader onClose={onClose}>
        <h3 className={`font-bold text-gray-900 ${isCreate ? 'text-lg' : ''}`}>
          {isCreate ? 'Thêm hồ sơ bệnh nhân mới' : 'Sửa thông tin bệnh nhân'}
        </h3>
      </ModalHeader>

      <ModalBody>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : (
          <>
            <PatientFormFields
              values={values}
              onChange={change}
              phone={isCreate
                ? { value: phone, editable: true, onChange: setPhone }
                : { value: target!.phone, editable: false }}
            />
            {error && <Alert variant="error" className="mt-6">{error}</Alert>}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Huỷ</button>
        <button
          onClick={submit}
          disabled={saving || !canSubmit}
          className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#15304d] transition-colors disabled:opacity-60"
        >
          {isCreate ? (saving ? 'Đang tạo...' : 'Tạo hồ sơ') : (saving ? 'Đang lưu...' : 'Lưu thay đổi')}
        </button>
      </ModalFooter>
    </Modal>
  );
}
