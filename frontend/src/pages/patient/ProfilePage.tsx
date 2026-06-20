import { useState, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProfile } from '@/features/users/hooks/useProfile';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GENDERS = [{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'other', label: 'Khác' }];

export default function ProfilePage() {
  const { user } = useAuth();
  const isPatient = user?.role?.code === 'patient';
  const {
    profile, loading, form, setForm, saving, success, error, save,
    avatarUploading, avatarProgress, uploadAvatar,
    pwForm, setPwForm, pwSaving, pwError, pwSuccess, changePassword, clearMessages,
  } = useProfile();
  const [tab, setTab] = useState<'info' | 'medical' | 'password'>('info');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
    e.target.value = '';
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thông tin cá nhân</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý hồ sơ và thông tin y tế của bạn.</p>
      </div>

      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            {form.avatar
              ? <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user?.name.charAt(0).toUpperCase()}
          </div>
          {!isPatient && (
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow hover:bg-blue-700 disabled:opacity-50"
              title="Đổi ảnh đại diện"
            >
              {avatarUploading
                ? <span className="text-[9px] font-bold">{avatarProgress ?? 0}%</span>
                : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m-6 6H6v-3l9-9 3 3-9 9z" /></svg>
              }
            </button>
          )}
          {!isPatient && (
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          )}
        </div>
        <div>
          <div className="text-xl font-bold">{user?.name}</div>
          <div className="text-sm text-gray-500 mt-0.5">{user?.phone}</div>
          <span className="inline-block mt-2 text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
            {profile?.role.name}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['info','👤 Thông tin cơ bản'], ['medical','🏥 Y tế'], ['password','🔒 Mật khẩu']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => { setTab(k); clearMessages(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === k ? 'bg-white shadow-sm text-main-text' : 'text-gray-500 hover:text-main-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Basic info ─────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Họ và tên *" value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại</label>
              <input
                disabled value={profile?.phone ?? ''}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="example@gmail.com" />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày sinh</label>
              <input
                type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giới tính</label>
              <select value={form.gender} onChange={set('gender')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Chưa chọn</option>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <Field label="CCCD / CMND" value={form.citizenId} onChange={set('citizenId')} placeholder="012345678901" />
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Địa chỉ</div>
            <Field label="Địa chỉ chi tiết" value={form.address} onChange={set('address')} placeholder="123 Đường ABC" />
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Phường/Xã" value={form.ward} onChange={set('ward')} placeholder="Dịch Vọng" />
              <Field label="Quận/Huyện" value={form.district} onChange={set('district')} placeholder="Cầu Giấy" />
              <Field label="Tỉnh/Thành" value={form.province} onChange={set('province')} placeholder="Hà Nội" />
            </div>
          </div>
          <SaveBar saving={saving} success={success} error={error} onSave={save} />
        </div>
      )}

      {/* ── Tab: Medical ─────────────────────────────────────────────────── */}
      {tab === 'medical' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nhóm máu</label>
              <select value={form.bloodType} onChange={set('bloodType')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Chưa xác định</option>
                {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <Field label="Dân tộc" value={form.ethnicity} onChange={set('ethnicity')} placeholder="Kinh" />
          </div>
          <TextareaField label="Dị ứng (thuốc, thực phẩm...)" value={form.allergies} onChange={set('allergies')} placeholder="Ví dụ: Dị ứng Penicillin, tôm, cua..." />
          <TextareaField label="Tiền sử bệnh" value={form.medicalHistory} onChange={set('medicalHistory')} placeholder="Ví dụ: Viêm da cơ địa từ nhỏ, cao huyết áp từ 2020..." />
          <Field label="Người liên hệ khẩn cấp" value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="Nguyễn Thị A — 0901 111 111 — Mẹ" />
          <SaveBar saving={saving} success={success} error={error} onSave={save} />
        </div>
      )}

      {/* ── Tab: Password ─────────────────────────────────────────────────── */}
      {tab === 'password' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">
            ⚠️ Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.
          </div>
          <PwField label="Mật khẩu hiện tại" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} />
          <PwField label="Mật khẩu mới" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} />
          <PwField label="Xác nhận mật khẩu mới" value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} />
          {pwError && <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{pwError}</div>}
          {pwSuccess && <div className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">{pwSuccess}</div>}
          <button
            onClick={changePassword}
            disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {pwSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all';

const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputCls} />
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
  </div>
);

const PwField = ({ label, value, onChange }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
          className={`${inputCls} pr-12`} placeholder="••••••••" />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const SaveBar = ({ saving, success, error, onSave }: {
  saving: boolean; success: string; error: string; onSave: () => void;
}) => (
  <div className="flex items-center gap-3 pt-2">
    <button
      onClick={onSave}
      disabled={saving}
      className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-60"
    >
      {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {saving ? 'Đang lưu...' : 'Lưu thông tin'}
    </button>
    {success && <span className="text-sm text-green-600 font-medium">✓ {success}</span>}
    {error && <span className="text-sm text-red-500">{error}</span>}
  </div>
);
