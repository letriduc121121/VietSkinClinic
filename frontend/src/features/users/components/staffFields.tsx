interface Option { id: number; name: string }

export const inputCls =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all';

export interface DoctorFields {
  specialty: string; specialtyCustom: string;
  degree: string; degreeCustom: string;
  experience: string; consultationFee: string; description: string;
}

function CustomSelect({ label, placeholder, value, customValue, options, onChange, onCustomChange }: {
  label: string; placeholder: string; value: string; customValue: string; options: Option[];
  onChange: (v: string) => void; onCustomChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <select
        className={inputCls + ' bg-white'}
        value={value}
        onChange={e => { onChange(e.target.value); if (e.target.value !== '__other__') onCustomChange(''); }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
        <option value="__other__">Khác (nhập tay)</option>
      </select>
      {value === '__other__' && (
        <input
          type="text" className={inputCls + ' mt-2'} value={customValue} autoFocus
          placeholder={label === 'Chuyên khoa' ? 'Nhập chuyên khoa...' : 'Nhập học hàm...'}
          onChange={e => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function DoctorProfileFields({ values, onChange, specialties, degrees }: {
  values: DoctorFields;
  onChange: (patch: Partial<DoctorFields>) => void;
  specialties: Option[];
  degrees: Option[];
}) {
  return (
    <div className="border-t border-gray-100 pt-4 space-y-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin chuyên môn</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <CustomSelect
            label="Chuyên khoa" placeholder="— Chọn chuyên khoa —" options={specialties}
            value={values.specialty} customValue={values.specialtyCustom}
            onChange={v => onChange({ specialty: v })} onCustomChange={v => onChange({ specialtyCustom: v })}
          />
        </div>
        <div className="sm:col-span-2">
          <CustomSelect
            label="Học hàm / Bằng cấp" placeholder="— Chọn học hàm —" options={degrees}
            value={values.degree} customValue={values.degreeCustom}
            onChange={v => onChange({ degree: v })} onCustomChange={v => onChange({ degreeCustom: v })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kinh nghiệm</label>
          <input type="text" value={values.experience} placeholder="10 năm" onChange={e => onChange({ experience: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phí khám (VNĐ)</label>
          <input type="number" min={0} value={values.consultationFee} placeholder="200000" onChange={e => onChange({ consultationFee: e.target.value })} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mô tả</label>
          <textarea rows={3} value={values.description} placeholder="Giới thiệu ngắn về bác sĩ..." onChange={e => onChange({ description: e.target.value })} className={inputCls + ' resize-none'} />
        </div>
      </div>
    </div>
  );
}
