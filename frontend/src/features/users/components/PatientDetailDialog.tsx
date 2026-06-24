import { useEffect, useState } from 'react';
import { userApi } from '../api/user.api';
import { medicalRecordApi } from '@/features/medical-records/api/medical-record.api';
import type { MedicalRecord } from '@/features/medical-records/types/medical-record.types';
import type { UserRecord } from '../types/user.types';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import { genderLabel } from '../lib/patient';
import { statusLabel } from '@/features/appointments/lib/status';
import { fmtDate, fmtVnd, initials } from '@/shared/lib/format';
import { Modal, ModalHeader, ModalFooter, CloseButton } from '@/shared/components/Modal';

interface Props { target: UserRecord; onClose: () => void; onPatientUpdated: (u: UserRecord) => void }

const Row = ({ label, value }: { label: string; value: string }) => (
  <div><span className="text-xs text-gray-400 font-semibold block">{label}</span><span className="text-gray-800 font-medium">{value}</span></div>
);

const aptCost = (a: Appointment) => (Number(a.doctor?.consultationFee) || 0) + (Number(a.service?.price) || 0);

export function PatientDetailDialog({ target, onClose, onPatientUpdated }: Props) {
  const [patient, setPatient] = useState<UserRecord>(target);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'info' | 'history'>('info');
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [apts, setApts] = useState<Appointment[]>([]);
  const [aptsLoading, setAptsLoading] = useState(false);
  const [records, setRecords] = useState<Record<number, MedicalRecord>>({});
  const [viewRec, setViewRec] = useState<MedicalRecord | null>(null);
  const [viewApt, setViewApt] = useState<Appointment | null>(null);

  useEffect(() => {
    setPatient(target); setTab('info'); setApts([]); setRecords({}); setEditName(false); setViewRec(null); setViewApt(null);
    if (target.patientProfile !== undefined) return;
    setLoading(true);
    userApi.getById(target.id).then(f => { setPatient(f); onPatientUpdated(f); }).catch(() => {}).finally(() => setLoading(false));
  }, [target.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    try { await userApi.update(patient.id, { name: nameVal.trim() }); const u = { ...patient, name: nameVal.trim() }; setPatient(u); onPatientUpdated(u); setEditName(false); }
    catch {} finally { setSaving(false); }
  };

  const loadHistory = async () => {
    setAptsLoading(true);
    try {
      const [a, r] = await Promise.all([userApi.getPatientAppointments(patient.id), medicalRecordApi.getByPatient(patient.id).catch(() => [] as MedicalRecord[])]);
      setApts(Array.isArray(a) ? a : []);
      const m: Record<number, MedicalRecord> = {};
      for (const x of r) if (x.appointment?.id != null) m[x.appointment.id] = x;
      setRecords(m);
    } catch { setApts([]); setRecords({}); } finally { setAptsLoading(false); }
  };

  const switchTab = (t: 'info' | 'history') => { setTab(t); setViewRec(null); setViewApt(null); if (t === 'history' && !apts.length && !aptsLoading) loadHistory(); };

  const pp = patient.patientProfile;
  const paid = apts.filter(a => a.status === 'done' && a.invoice);
  const totalSpent = paid.reduce((s, a) => s + (a.invoice?.amount != null ? Number(a.invoice.amount) : aptCost(a)), 0);

  return (
    <Modal maxWidth="max-w-lg">
      <ModalHeader>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold flex-shrink-0">{initials(patient.name)}</div>
          <div className="flex-1 min-w-0">
            {editName ? (
              <div className="flex items-center gap-2">
                <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)} className="text-sm font-bold border-b border-[#1a3a5c] outline-none bg-transparent w-36" onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }} />
                <button onClick={saveName} disabled={saving} className="text-xs text-teal-600 font-semibold disabled:opacity-50">{saving ? '...' : 'Lưu'}</button>
                <button onClick={() => setEditName(false)} className="text-xs text-gray-400">Huỷ</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 truncate">{patient.name}</h3>
                <button onClick={() => { setNameVal(patient.name); setEditName(true); }} className="text-gray-300 hover:text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{pp?.patientCode ?? `#${patient.id}`}</p>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </ModalHeader>

      <div className="flex gap-1 px-6 pt-2 border-b border-gray-100">
        {(['info', 'history'] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-[#1a3a5c] text-[#1a3a5c]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t === 'info' ? 'Thông tin cá nhân' : 'Lịch sử khám'}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5 overflow-y-auto">
        {loading ? <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>

        /* ── TAB: Thông tin cá nhân ── */
        : tab === 'info' ? (<>
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin cơ bản</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Row label="Họ tên" value={patient.name} />
              <Row label="Mã bệnh nhân" value={pp?.patientCode ?? `#${patient.id}`} />
              <Row label="Số điện thoại" value={patient.phone} />
              <Row label="Email" value={patient.email || '—'} />
              <Row label="Trạng thái" value={patient.active ? 'Đang hoạt động' : 'Đã khoá'} />
              <Row label="Ngày tạo" value={fmtDate(patient.createdAt)} />
            </div>
          </section>
          <section className="border-t border-gray-100 pt-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hồ sơ bệnh nhân</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Row label="Ngày sinh" value={fmtDate(pp?.dateOfBirth)} />
              <Row label="Giới tính" value={genderLabel[pp?.gender ?? ''] ?? '—'} />
              <Row label="Nhóm máu" value={pp?.bloodType || '—'} />
              <Row label="Dân tộc" value={pp?.ethnicity || '—'} />
              <Row label="Số CCCD / CMND" value={pp?.citizenId || '—'} />
              <Row label="Liên hệ khẩn cấp" value={pp?.emergencyContact || '—'} />
              <div className="col-span-2"><Row label="Địa chỉ" value={[pp?.address, pp?.ward, pp?.district, pp?.province].filter(Boolean).join(', ') || '—'} /></div>
            </div>
            <div className="space-y-3 text-sm mt-4 border-t border-gray-50 pt-4">
              <div><span className="text-xs text-gray-500 font-semibold">Dị ứng</span><p className="text-gray-700 mt-1">{pp?.allergies || '—'}</p></div>
              <div><span className="text-xs text-gray-500 font-semibold">Tiền sử bệnh</span><p className="text-gray-700 mt-1">{pp?.medicalHistory || '—'}</p></div>
            </div>
          </section>
        </>)

        /* ── TAB: Chi tiết 1 bệnh án ── */
        : viewRec ? (
          <div className="space-y-4">
            <button onClick={() => { setViewRec(null); setViewApt(null); }} className="flex items-center gap-1.5 text-sm text-[#1a3a5c] font-medium hover:underline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Quay lại lịch sử
            </button>

            <div className="bg-[#1a3a5c] rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs opacity-70">Ngày khám</div>
                  <div className="font-bold">{viewRec.appointment?.date ? fmtDate(viewRec.appointment.date) : fmtDate(viewRec.createdAt)}{viewRec.appointment?.time ? ` · ${viewRec.appointment.time}` : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-70">Bác sĩ</div>
                  <div className="font-bold">{viewRec.doctor?.user.name ?? '—'}</div>
                </div>
              </div>
              {viewRec.appointment?.service?.name && <div className="mt-2 pt-2 border-t border-white/15 text-xs"><span className="opacity-70">Dịch vụ: </span>{viewRec.appointment.service.name}</div>}
              {viewApt && aptCost(viewApt) > 0 && (
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                  <span className="opacity-70">Chi phí khám</span>
                  <span className="font-bold text-base">
                    {fmtVnd(viewApt.invoice?.amount != null ? Number(viewApt.invoice.amount) : aptCost(viewApt))}
                    {viewApt.invoice?.status === 'paid' && <span className="ml-1.5 text-[10px] bg-green-400/20 text-green-300 px-1.5 py-0.5 rounded-full">Đã thanh toán</span>}
                  </span>
                </div>
              )}
            </div>

            {[
              { l: 'Triệu chứng', v: viewRec.symptoms }, { l: 'Loại da', v: viewRec.skinType },
              { l: 'Vị trí tổn thương', v: viewRec.lesionLocation }, { l: 'Chẩn đoán', v: viewRec.diagnosis },
              { l: 'Phác đồ điều trị', v: viewRec.treatment }, { l: 'Ghi chú bác sĩ', v: viewRec.note },
            ].map(f => (
              <div key={f.l}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{f.l}</div>
                <div className={`text-sm rounded-lg px-3 py-2.5 ${f.v ? 'text-gray-700 bg-gray-50' : 'text-gray-400 bg-gray-50/50 italic'}`}>{f.v || 'Chưa có thông tin'}</div>
              </div>
            ))}

            {viewRec.followUpDate && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200 w-fit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Tái khám: {fmtDate(viewRec.followUpDate)}
              </div>
            )}

            {(viewRec.images?.length ?? 0) > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ảnh tổn thương da</div>
                <div className="grid grid-cols-3 gap-2">
                  {viewRec.images!.map((img: any) => (
                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-gray-100"><img src={img.imageUrl} alt={img.note ?? 'Ảnh'} className="w-full h-full object-cover" /></div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Đơn thuốc {(viewRec.prescriptions?.length ?? 0) > 0 ? `(${viewRec.prescriptions!.length})` : ''}</div>
              {(viewRec.prescriptions?.length ?? 0) === 0 ? (
                <div className="text-sm text-gray-400 italic bg-gray-50/50 rounded-lg px-3 py-2.5">Chưa có đơn thuốc</div>
              ) : viewRec.prescriptions!.map((p: any, pi: number) => (
                <div key={p.id} className="rounded-lg border border-gray-100 overflow-hidden mb-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-600">Đơn #{pi + 1}</span>
                    {p.note && <span className="text-xs text-gray-500 italic flex-1 truncate">— {p.note}</span>}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {p.items.map((item: any, i: number) => (
                      <div key={item.id ?? i} className="flex gap-2 px-3 py-2">
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{item.medicineName}</div>
                          <div className="text-xs text-gray-500">{[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}{item.quantity ? ` · ${item.quantity} đv` : ''}</div>
                          {item.note && <div className="text-xs text-gray-400 italic">{item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

        /* ── TAB: Danh sách lịch sử khám ── */
        : aptsLoading ? <div className="py-8 text-center text-gray-400 text-sm">Đang tải lịch sử...</div>
        : apts.length === 0 ? <div className="py-10 text-center text-gray-400 text-sm">Bệnh nhân chưa có lịch khám nào.</div>
        : (
          <div className="space-y-4">
            {/* Tổng quan */}
            <div className="bg-gradient-to-r from-[#1a3a5c] to-[#2d5a8e] rounded-xl p-4 text-white flex items-center justify-between">
              <div><div className="text-xs opacity-70">Tổng lượt khám</div><div className="text-2xl font-bold">{apts.length}</div></div>
              <div className="text-right"><div className="text-xs opacity-70">Tổng chi phí ({paid.length} lần thanh toán)</div><div className="text-2xl font-bold">{fmtVnd(totalSpent)}</div></div>
            </div>

            {/* Danh sách */}
            <div className="space-y-3">
              {apts.map(apt => {
                const st = statusLabel[apt.status] ?? { text: apt.status, cls: 'bg-gray-100 text-gray-500' };
                const rec = records[apt.id];
                const cost = aptCost(apt);
                const hasPaid = apt.invoice?.status === 'paid';
                return (
                  <div key={apt.id} onClick={rec ? () => { setViewApt(apt); setViewRec(rec); } : undefined}
                    className={`border border-gray-100 rounded-xl overflow-hidden transition-colors ${rec ? 'cursor-pointer hover:border-[#1a3a5c]/40 hover:bg-gray-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900">{fmtDate(apt.date)}{apt.time && <span className="text-gray-500 font-normal"> · {apt.time}</span>}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{apt.doctor?.user?.name ?? '—'}{apt.service?.name && <span> · {apt.service.name}</span>}</div>
                        {rec?.diagnosis && <div className="text-xs text-gray-400 mt-1 italic truncate">{rec.diagnosis}</div>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.text}</span>
                        {cost > 0 && (
                          <span className={`text-xs font-bold ${hasPaid ? 'text-green-600' : apt.invoice ? 'text-orange-500' : 'text-gray-400'}`}>
                            {fmtVnd(apt.invoice?.amount != null ? Number(apt.invoice.amount) : cost)}
                            {hasPaid && <svg className="w-3 h-3 inline ml-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </span>
                        )}
                        {rec
                          ? <span className="flex items-center gap-0.5 text-xs text-[#1a3a5c] font-medium">Xem chi tiết<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                          : <span className="text-xs text-gray-300">Chưa khám</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
      </ModalFooter>
    </Modal>
  );
}
