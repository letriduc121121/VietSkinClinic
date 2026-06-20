import { useEffect, useState } from 'react';
import { userApi } from '../api/user.api';
import { medicalRecordApi } from '@/features/medical-records/api/medical-record.api';
import type { MedicalRecord } from '@/features/medical-records/types/medical-record.types';
import type { UserRecord } from '../types/user.types';
import { genderLabel } from '../lib/patient';
import { statusLabel } from '@/features/appointments/lib/status';
import { fmtDate, initials } from '@/shared/lib/format';
import { Modal, ModalHeader, ModalFooter, CloseButton } from '@/shared/components/Modal';

interface Props {
  target: UserRecord;
  onClose: () => void;
  onPatientUpdated: (u: UserRecord) => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400 font-semibold block">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export function PatientDetailDialog({ target, onClose, onPatientUpdated }: Props) {
  const [patient, setPatient] = useState<UserRecord>(target);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<'info' | 'history'>('info');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [recordsByAppt, setRecordsByAppt] = useState<Record<number, MedicalRecord>>({});
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    setPatient(target);
    setTab('info');
    setAppointments([]);
    setRecordsByAppt({});
    setEditingName(false);
    setViewingRecord(null);
    if (target.patientProfile !== undefined) return;
    setDetailLoading(true);
    userApi.getById(target.id)
      .then(full => { setPatient(full); onPatientUpdated(full); })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setNameSaving(true);
    try {
      await userApi.update(patient.id, { name: nameVal.trim() });
      const updated = { ...patient, name: nameVal.trim() };
      setPatient(updated);
      onPatientUpdated(updated);
      setEditingName(false);
    } catch { /* silent */ } finally {
      setNameSaving(false);
    }
  };

  const loadHistory = async (patientId: number) => {
    setApptLoading(true);
    try {
      const [appts, records] = await Promise.all([
        userApi.getPatientAppointments(patientId),
        medicalRecordApi.getByPatient(patientId).catch(() => [] as MedicalRecord[]),
      ]);
      setAppointments(Array.isArray(appts) ? appts : []);
      const map: Record<number, MedicalRecord> = {};
      for (const r of records) if (r.appointment?.id != null) map[r.appointment.id] = r;
      setRecordsByAppt(map);
    } catch {
      setAppointments([]);
      setRecordsByAppt({});
    } finally {
      setApptLoading(false);
    }
  };

  const switchTab = (next: 'info' | 'history') => {
    setTab(next);
    setViewingRecord(null);
    if (next === 'history' && appointments.length === 0 && !apptLoading) {
      loadHistory(patient.id);
    }
  };

  return (
    <Modal maxWidth="max-w-lg">
      <ModalHeader>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  className="text-sm font-bold border-b border-[#1a3a5c] outline-none bg-transparent w-36"
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button onClick={saveName} disabled={nameSaving} className="text-xs text-teal-600 font-semibold hover:text-teal-700 disabled:opacity-50">
                  {nameSaving ? '...' : 'Lưu'}
                </button>
                <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-gray-600">Huỷ</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 truncate">{patient.name}</h3>
                <button onClick={() => { setNameVal(patient.name); setEditingName(true); }} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{patient.patientProfile?.patientCode ?? `#${patient.id}`}</p>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </ModalHeader>

      <div className="flex gap-1 px-6 pt-2 border-b border-gray-100">
        {(['info', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? 'border-[#1a3a5c] text-[#1a3a5c]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'info' ? 'Thông tin cá nhân' : 'Lịch sử khám'}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5 overflow-y-auto">
        {detailLoading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : tab === 'info' ? (
          <>
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin cơ bản</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <InfoRow label="Họ tên" value={patient.name} />
                <InfoRow label="Mã bệnh nhân" value={patient.patientProfile?.patientCode ?? `#${patient.id}`} />
                <InfoRow label="Số điện thoại" value={patient.phone} />
                <InfoRow label="Email" value={patient.email || '—'} />
                <InfoRow label="Trạng thái" value={patient.active ? 'Đang hoạt động' : 'Đã khoá'} />
                <InfoRow label="Ngày tạo" value={fmtDate(patient.createdAt)} />
              </div>
            </section>

            <section className="border-t border-gray-100 pt-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hồ sơ bệnh nhân</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <InfoRow label="Ngày sinh" value={fmtDate(patient.patientProfile?.dateOfBirth)} />
                <InfoRow label="Giới tính" value={genderLabel[patient.patientProfile?.gender ?? ''] ?? '—'} />
                <InfoRow label="Nhóm máu" value={patient.patientProfile?.bloodType || '—'} />
                <InfoRow label="Dân tộc" value={patient.patientProfile?.ethnicity || '—'} />
                <InfoRow label="Số CCCD / CMND" value={patient.patientProfile?.citizenId || '—'} />
                <InfoRow label="Liên hệ khẩn cấp" value={patient.patientProfile?.emergencyContact || '—'} />
                <div className="col-span-2">
                  <InfoRow
                    label="Địa chỉ"
                    value={[
                      patient.patientProfile?.address,
                      patient.patientProfile?.ward,
                      patient.patientProfile?.district,
                      patient.patientProfile?.province,
                    ].filter(Boolean).join(', ') || '—'}
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm mt-4 border-t border-gray-50 pt-4">
                <div>
                  <span className="text-xs text-gray-500 font-semibold">Dị ứng</span>
                  <p className="text-gray-700 mt-1">{patient.patientProfile?.allergies || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold">Tiền sử bệnh</span>
                  <p className="text-gray-700 mt-1">{patient.patientProfile?.medicalHistory || '—'}</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          viewingRecord ? (
            <div className="space-y-4">
              <button onClick={() => setViewingRecord(null)} className="flex items-center gap-1.5 text-sm text-[#1a3a5c] font-medium hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại lịch sử
              </button>

              <div className="bg-[#1a3a5c] rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-70">Ngày khám</div>
                    <div className="font-bold">
                      {viewingRecord.appointment?.date ? fmtDate(viewingRecord.appointment.date) : fmtDate(viewingRecord.createdAt)}
                      {viewingRecord.appointment?.time ? ` · ${viewingRecord.appointment.time}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-70">Bác sĩ</div>
                    <div className="font-bold">{viewingRecord.doctor?.user.name ?? '—'}</div>
                  </div>
                </div>
                {viewingRecord.appointment?.service?.name && (
                  <div className="mt-2 pt-2 border-t border-white/15 text-xs">
                    <span className="opacity-70">Dịch vụ: </span>
                    {viewingRecord.appointment.service.name}
                  </div>
                )}
              </div>

              {[
                { label: 'Triệu chứng', value: viewingRecord.symptoms },
                { label: 'Loại da', value: viewingRecord.skinType },
                { label: 'Vị trí tổn thương', value: viewingRecord.lesionLocation },
                { label: 'Chẩn đoán', value: viewingRecord.diagnosis },
                { label: 'Phác đồ điều trị', value: viewingRecord.treatment },
                { label: 'Ghi chú bác sĩ', value: viewingRecord.note },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{f.label}</div>
                  <div className={`text-sm rounded-lg px-3 py-2.5 ${f.value ? 'text-gray-700 bg-gray-50' : 'text-gray-400 bg-gray-50/50 italic'}`}>
                    {f.value || 'Chưa có thông tin'}
                  </div>
                </div>
              ))}

              {viewingRecord.followUpDate && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200 w-fit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Tái khám: {fmtDate(viewingRecord.followUpDate)}
                </div>
              )}

              {(viewingRecord.images?.length ?? 0) > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ảnh tổn thương da</div>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingRecord.images!.map((img: any) => (
                      <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-gray-100">
                        <img src={img.imageUrl} alt={img.note ?? 'Ảnh'} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Đơn thuốc {(viewingRecord.prescriptions?.length ?? 0) > 0 ? `(${viewingRecord.prescriptions!.length})` : ''}
                </div>
                {(viewingRecord.prescriptions?.length ?? 0) === 0 ? (
                  <div className="text-sm text-gray-400 italic bg-gray-50/50 rounded-lg px-3 py-2.5">Chưa có đơn thuốc</div>
                ) : (
                  viewingRecord.prescriptions!.map((p: any, pi: number) => (
                    <div key={p.id} className="rounded-lg border border-gray-100 overflow-hidden mb-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-600">Đơn #{pi + 1}</span>
                        {p.note && <span className="text-xs text-gray-500 italic flex-1 truncate">— {p.note}</span>}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {p.items.map((item: any, i: number) => (
                          <div key={item.id ?? i} className="flex gap-2 px-3 py-2">
                            <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{item.medicineName}</div>
                              <div className="text-xs text-gray-500">
                                {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}
                                {item.quantity ? ` · ${item.quantity} đv` : ''}
                              </div>
                              {item.note && <div className="text-xs text-gray-400 italic">{item.note}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : apptLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Đang tải lịch sử...</div>
          ) : appointments.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Bệnh nhân chưa có lịch khám nào.</div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt: any) => {
                const st = statusLabel[apt.status] ?? { text: apt.status, cls: 'bg-gray-100 text-gray-500' };
                const record = recordsByAppt[apt.id];
                return (
                  <div
                    key={apt.id}
                    onClick={record ? () => setViewingRecord(record) : undefined}
                    className={`border border-gray-100 rounded-xl overflow-hidden transition-colors ${
                      record ? 'cursor-pointer hover:border-[#1a3a5c]/40 hover:bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900">
                          {fmtDate(apt.date)}
                          {apt.time && <span className="text-gray-500 font-normal"> · {apt.time}</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {apt.doctor?.user?.name ?? '—'}
                          {apt.service?.name && <span> · {apt.service.name}</span>}
                        </div>
                        {record?.diagnosis && <div className="text-xs text-gray-400 mt-1 italic truncate">{record.diagnosis}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.text}</span>
                        {record ? (
                          <span className="flex items-center gap-0.5 text-xs text-[#1a3a5c] font-medium">
                            Xem chi tiết
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Chưa khám</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <ModalFooter>
        <button onClick={onClose} className="w-full border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
      </ModalFooter>
    </Modal>
  );
}
