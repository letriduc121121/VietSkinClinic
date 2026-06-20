import type { PatientFormValues } from '../types/user.types';
import { BLOOD_TYPES } from '../lib/patient';
import { TextField, SelectField, TextareaField } from './fields';

interface Props {
  values: PatientFormValues;
  onChange: (patch: Partial<PatientFormValues>) => void;
  phone: { value: string; editable: boolean; onChange?: (v: string) => void };
}

export function PatientFormFields({ values, onChange, phone }: Props) {
  const set = (k: keyof PatientFormValues) => (v: string) => onChange({ [k]: v });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin cơ bản</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Họ tên" required value={values.name} onChange={set('name')} placeholder="Nhập họ tên" />
          <TextField
            label="Số điện thoại"
            required={phone.editable}
            value={phone.value}
            onChange={phone.onChange}
            disabled={!phone.editable}
            type="tel"
            placeholder="Nhập số điện thoại"
          />
          <TextField label="Email" colSpan value={values.email} onChange={set('email')} type="email" placeholder="email@example.com" />
        </div>
      </section>

      <section className="border-t border-gray-100 pt-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Hồ sơ bệnh nhân</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Ngày sinh" type="date" value={values.dateOfBirth} onChange={set('dateOfBirth')} />
          <SelectField label="Giới tính" value={values.gender} onChange={set('gender')}>
            <option value="">-- Chọn --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </SelectField>
          <SelectField label="Nhóm máu" value={values.bloodType} onChange={set('bloodType')}>
            <option value="">-- Chọn --</option>
            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
          </SelectField>
          <TextField label="Dân tộc" value={values.ethnicity} onChange={set('ethnicity')} placeholder="Kinh, Tày, Mường..." />
          <TextField label="Số CCCD / CMND" value={values.citizenId} onChange={set('citizenId')} placeholder="012345678901" />
          <TextField label="Liên hệ khẩn cấp" value={values.emergencyContact} onChange={set('emergencyContact')} placeholder="Tên - SĐT" />
          <TextField label="Địa chỉ" colSpan value={values.address} onChange={set('address')} placeholder="Số nhà, đường..." />
          <TextField label="Phường / Xã" value={values.ward} onChange={set('ward')} />
          <TextField label="Quận / Huyện" value={values.district} onChange={set('district')} />
          <TextField label="Tỉnh / Thành phố" value={values.province} onChange={set('province')} />
          <TextField label="Dị ứng" colSpan value={values.allergies} onChange={set('allergies')} placeholder="Penicillin, hải sản..." />
          <TextareaField label="Tiền sử bệnh" colSpan value={values.medicalHistory} onChange={set('medicalHistory')} placeholder="Tiểu đường, cao huyết áp..." />
        </div>
      </section>
    </div>
  );
}
