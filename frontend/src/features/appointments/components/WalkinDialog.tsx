import { useState } from 'react';
import { authApi } from '@/features/auth/api/auth.api';
import { userApi } from '@/features/users/api/user.api';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import type { Service } from '@/features/services/types/service.types';
import { appointmentApi } from '../api/appointment.api';

interface FoundPatient { id: number; name: string; phone: string }

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c]/40';

interface Props {
  doctors: Doctor[];
  services: Service[];
  onClose: () => void;
  onCreated: () => void;
}

export function WalkinDialog({ doctors, services, onClose, onCreated }: Props) {
  const [walkinMode, setWalkinMode] = useState<'existing' | 'new'>('existing');
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState<FoundPatient | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDateOfBirth, setNewDateOfBirth] = useState('');
  const [newGender, setNewGender] = useState<'' | 'male' | 'female' | 'other'>('');
  const [newAddress, setNewAddress] = useState('');
  const [phoneCheckState, setPhoneCheckState] = useState<'idle' | 'checking' | 'exists' | 'free'>('idle');
  const [wDoctorId, setWDoctorId] = useState('');
  const [doctorAvail, setDoctorAvail] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [wServiceId, setWServiceId] = useState('');
  const [wSymptoms, setWSymptoms] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

  const handleDoctorChange = async (id: string) => {
    setWDoctorId(id);
    if (!id) { setDoctorAvail('idle'); return; }
    setDoctorAvail('checking');
    try {
      const slots = await doctorApi.getSlots(Number(id), todayISO());
      setDoctorAvail(slots.workDay ? 'available' : 'unavailable');
    } catch { setDoctorAvail('idle'); }
  };

  const handleNewPhoneBlur = async () => {
    const phone = newPhone.trim();
    if (phone.length < 9) { setPhoneCheckState('idle'); return; }
    setPhoneCheckState('checking');
    try {
      await userApi.searchByPhone(phone);
      setPhoneCheckState('exists');
    } catch { setPhoneCheckState('free'); }
  };

  const handleSearchPatient = async () => {
    if (!searchPhone.trim()) return;
    setSearching(true); setFoundPatient(null); setSearchDone(false); setWError('');
    try {
      const patient = await userApi.searchByPhone(searchPhone.trim());
      setFoundPatient(patient);
      setSearchDone(true);
    } catch { setSearchDone(true); } finally { setSearching(false); }
  };

  const handleSubmit = async () => {
    setWError('');
    const isNew = walkinMode === 'new';
    if (isNew && (!newName.trim() || !newPhone.trim())) { setWError('Vui lòng nhập họ tên và số điện thoại'); return; }
    if (isNew && phoneCheckState === 'exists') { setWError('Số điện thoại này đã có tài khoản. Vui lòng dùng tab "Bệnh nhân cũ".'); return; }
    if (!isNew && !foundPatient) { setWError('Vui lòng tìm và chọn bệnh nhân'); return; }
    if (!wDoctorId) { setWError('Vui lòng chọn bác sĩ'); return; }
    setWLoading(true);
    try {
      let patientId: number | undefined, patientName: string, patientPhone: string;
      if (isNew) {
        const regRes = await authApi.register({
          name: newName.trim(),
          phone: newPhone.trim(),
          password: newPhone.trim(),
          dateOfBirth: newDateOfBirth || undefined,
          gender: newGender || undefined,
          address: newAddress.trim() || undefined,
        });
        patientId = regRes.user.id;
        patientName = newName.trim(); patientPhone = newPhone.trim();
      } else {
        patientId = foundPatient!.id; patientName = foundPatient!.name; patientPhone = foundPatient!.phone;
      }
      await appointmentApi.create({
        patientId, patientName, patientPhone,
        doctorId: Number(wDoctorId),
        serviceId: wServiceId ? Number(wServiceId) : undefined,
        date: todayISO(),
        symptoms: wSymptoms || undefined,
        isWalkin: true,
      } as any);
      onCreated();
      onClose();
    } catch (e: any) { setWError(e?.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setWLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold">Tạo phiếu khám</h3>
            <p className="text-xs text-gray-400 mt-0.5">Bệnh nhân đến trực tiếp — cấp STT ngay</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {(['existing', 'new'] as const).map(mode => (
              <button key={mode} onClick={() => { setWalkinMode(mode); setWError(''); }}
                className={`flex-1 py-2.5 text-sm font-bold transition-all ${walkinMode === mode ? 'bg-[#1a3a5c] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                {mode === 'existing' ? 'Bệnh nhân cũ' : 'Bệnh nhân mới'}
              </button>
            ))}
          </div>

          {walkinMode === 'existing' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase block">Tìm theo số điện thoại</label>
              <div className="flex gap-2">
                <input type="tel" value={searchPhone} onChange={e => { setSearchPhone(e.target.value); setFoundPatient(null); setSearchDone(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleSearchPatient()} placeholder="09xx xxx xxx" className={inputCls + ' flex-1'} />
                <button onClick={handleSearchPatient} disabled={searching || !searchPhone.trim()}
                  className="px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all disabled:opacity-60 whitespace-nowrap">
                  {searching ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Tìm'}
                </button>
              </div>
              {searchDone && (foundPatient ? (
                <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="w-10 h-10 bg-[#1a3a5c] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">{foundPatient.name.charAt(0)}</div>
                  <div><div className="font-bold text-sm">{foundPatient.name}</div><div className="text-xs text-gray-500">{foundPatient.phone}</div></div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  Không tìm thấy. <button onClick={() => setWalkinMode('new')} className="font-bold underline ml-1">Đăng ký mới?</button>
                </div>
              ))}
            </div>
          )}

          {walkinMode === 'new' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Họ tên *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">SĐT *</label>
                  <div className="relative">
                    <input
                      type="tel" value={newPhone}
                      onChange={e => { setNewPhone(e.target.value); setPhoneCheckState('idle'); }}
                      onBlur={handleNewPhoneBlur}
                      placeholder="09xx xxx xxx"
                      className={`${inputCls} pr-8 ${phoneCheckState === 'exists' ? 'border-red-400 focus:border-red-400' : phoneCheckState === 'free' ? 'border-green-400 focus:border-green-400' : ''}`}
                    />
                    {phoneCheckState === 'checking' && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                    {phoneCheckState === 'exists' && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </span>
                    )}
                    {phoneCheckState === 'free' && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                  </div>
                  {phoneCheckState === 'exists' && (
                    <p className="text-xs text-red-500 mt-1">
                      SĐT đã có tài khoản.{' '}
                      <button onClick={() => { setWalkinMode('existing'); setSearchPhone(newPhone); setPhoneCheckState('idle'); }} className="font-bold underline">Dùng tab bệnh nhân cũ?</button>
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">Tài khoản tạo tự động, mật khẩu mặc định là SĐT.</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Ngày sinh</label>
                  <input type="date" value={newDateOfBirth} onChange={e => setNewDateOfBirth(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Giới tính</label>
                  <select value={newGender} onChange={e => setNewGender(e.target.value as any)} className={inputCls}>
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Địa chỉ</label>
                <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Số nhà, đường, phường, quận, TP..." className={inputCls} />
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin khám</div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Bác sĩ *</label>
              <select value={wDoctorId} onChange={e => handleDoctorChange(e.target.value)}
                className={`${inputCls} ${doctorAvail === 'unavailable' ? 'border-amber-400 focus:border-amber-400' : doctorAvail === 'available' ? 'border-green-400 focus:border-green-400' : ''}`}>
                <option value="">Chọn bác sĩ</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.user.name} — {Number(d.consultationFee).toLocaleString('vi-VN')}đ</option>
                ))}
              </select>
              {doctorAvail === 'checking' && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                  Đang kiểm tra lịch làm việc...
                </p>
              )}
              {doctorAvail === 'available' && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Bác sĩ có lịch làm việc hôm nay
                </p>
              )}
              {doctorAvail === 'unavailable' && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Bác sĩ không có lịch làm việc hôm nay, vẫn có thể tạo phiếu
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
                Dịch vụ <span className="font-normal text-gray-400 normal-case">(tuỳ chọn)</span>
              </label>
              <select value={wServiceId} onChange={e => setWServiceId(e.target.value)} className={inputCls}>
                <option value="">Không có dịch vụ</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {Number(s.price).toLocaleString('vi-VN')}đ{s.duration ? ` (${s.duration} phút)` : ''}
                  </option>
                ))}
              </select>
              {wServiceId && (() => {
                const svc = services.find(s => String(s.id) === wServiceId);
                const doctor = doctors.find(d => String(d.id) === wDoctorId);
                const total = (svc ? Number(svc.price) : 0) + (doctor ? Number(doctor.consultationFee) : 0);
                return svc ? (
                  <div className="mt-2 flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 text-xs">
                    <span className="text-purple-600 font-medium">{svc.name}</span>
                    <span className="font-bold text-purple-700">{total > 0 ? `Tổng: ${total.toLocaleString('vi-VN')}đ` : `${Number(svc.price).toLocaleString('vi-VN')}đ`}</span>
                  </div>
                ) : null;
              })()}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Triệu chứng</label>
              <textarea value={wSymptoms} onChange={e => setWSymptoms(e.target.value)} rows={2} placeholder="Mô tả triệu chứng..." className={inputCls + ' resize-none'} />
            </div>
            <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Bệnh nhân sẽ được cấp số thứ tự ngay khi tạo phiếu.
            </div>
          </div>

          {wError && <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{wError}</div>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Huỷ</button>
          <button onClick={handleSubmit} disabled={wLoading}
            className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
            {wLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {wLoading ? 'Đang xử lý...' : 'Tạo phiếu & Cấp STT'}
          </button>
        </div>
      </div>
    </div>
  );
}
