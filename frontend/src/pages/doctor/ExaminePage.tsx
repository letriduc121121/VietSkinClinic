import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useExamine, type HistoryRecord } from '@/features/medical-records/hooks/useExamine';
import { PrescriptionPrint } from '@/features/prescriptions/components/PrescriptionPrint';
import { fmtExamDate, calcAge, genderLabel, todayStr, formatInstruction, type PresItem } from '@/features/medical-records/lib/exam';

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 bg-white';

export default function ExaminePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const ex = useExamine(appointmentId);
  const {
    apt, history, loading, saving, finishing, success, error, setError,
    record, hasFollowUp, setHasFollowUp, recForm, setRecForm,
    presItems, prescriptions, presNote, setPresNote, medSearch, setMedSearch, savingPres,
    openPres, setOpenPres, filteredMeds, addMed, updatePres, removePres,
    images, uploadingImg, uploadProgress, uploadImages, deleteImage,
    saveRecord, savePrescription, deletePrescription, finish,
  } = ex;

  const [lightbox, setLightbox] = useState<typeof images[number] | null>(null);
  const [printData, setPrintData] = useState<{ note?: string | null; items: PresItem[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const delPres = useDisclosure<number>();
  const [deletingPres, setDeletingPres] = useState(false);
  const [editing, setEditing] = useState(false);

  const handlePrintAll = () => {
    setPrintData({
      note: prescriptions.map(p => p.note).filter(Boolean).join('; ') || null,
      items: prescriptions.flatMap(p => p.items),
    });
    setTimeout(() => window.print(), 150);
  };

  const confirmDeletePres = async () => {
    if (delPres.data == null) return;
    setDeletingPres(true);
    try { await deletePrescription(delPres.data); delPres.close(); }
    finally { setDeletingPres(false); }
  };

  const handleFinish = async () => { if (await finish()) navigate('/doctor/today'); };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin mr-3" />
      Đang tải...
    </div>
  );
  if (!apt) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Không tìm thấy lịch hẹn.</p>
      <Link to="/doctor/today" className="text-[#1a3a5c] underline text-sm mt-2 inline-block">← Quay lại</Link>
    </div>
  );

  const patient = apt.patient;
  const profile = patient?.patientProfile;
  const displayName = patient?.name ?? apt.patientName;
  const displayPhone = patient?.phone ?? apt.patientPhone ?? '–';
  const initials = displayName.split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase();
  const isDone = apt.status === 'done';
  const readOnly = isDone && !editing;

  return (
    <>
      <div className="space-y-4 no-print">
        <div className="flex items-center gap-3">
          <Link to="/doctor/today" className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-[#1a3a5c]">{profile?.patientCode ? `[${profile.patientCode}] ` : ''}{displayName}</h1>
            <p className="text-xs text-gray-500">
              Khám lúc <span className="font-medium text-gray-700">{fmtExamDate(apt.date)} · {apt.time.slice(0, 5)}</span>
              {apt.queueNumber && <strong className="ml-2 text-[#1a3a5c]">· STT #{apt.queueNumber}</strong>}
              {apt.service && <span className="ml-2 text-gray-400">· {apt.service.name}</span>}
            </p>
          </div>
          {isDone && <span className="ml-auto text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">✓ Đã hoàn thành</span>}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1a3a5c] text-white rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0">{initials}</div>
                <div>
                  <div className="font-bold text-gray-900">{displayName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {genderLabel(profile?.gender ?? null)}{profile?.dateOfBirth && ` · ${calcAge(profile.dateOfBirth)} tuổi`}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {profile?.dateOfBirth && <InfoRow icon="📅" label="Ngày sinh" value={fmtExamDate(profile.dateOfBirth)} />}
                <InfoRow icon="📞" label="SĐT" value={displayPhone} />
                {(profile?.province || profile?.address) && <InfoRow icon="📍" label="Địa chỉ" value={profile.province ?? profile.address ?? ''} />}
                {profile?.bloodType && <InfoRow icon="🩸" label="Nhóm máu" value={profile.bloodType} />}
                {profile?.allergies && <InfoRow icon="⚠️" label="Dị ứng" value={profile.allergies} highlight />}
                {profile?.medicalHistory && <InfoRow icon="📋" label="Tiền sử" value={profile.medicalHistory} />}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-sm">🕐</span>
                <span className="text-sm font-bold text-gray-700">Lịch sử khám bệnh</span>
                {history.length > 0 && <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{history.length} lần</span>}
              </div>
              <div className="p-4">
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-3">Chưa có lịch sử khám</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">{history.map(h => <HistoryRow key={h.id} record={h} />)}</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Tạo hồ sơ khám bệnh</h3>
                {record?.id && <span className="text-[11px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold">Đang cập nhật</span>}
              </div>

              <div className="p-6 space-y-5">
                <FormField label="Triệu chứng" required>
                  <textarea rows={2} className={`${inp} resize-none`} value={recForm.symptoms} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, symptoms: e.target.value }))} placeholder="Mô tả triệu chứng bệnh nhân..." />
                </FormField>
                <FormField label="Chuẩn đoán" required>
                  <textarea rows={2} className={`${inp} resize-none`} value={recForm.diagnosis} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Chẩn đoán của bác sĩ..." />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Loại da">
                    <select className={inp} value={recForm.skinType} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, skinType: e.target.value }))}>
                      <option value="">-- Chọn --</option>
                      <option value="da_dau">Da dầu</option>
                      <option value="da_kho">Da khô</option>
                      <option value="da_hon_hop">Da hỗn hợp</option>
                      <option value="da_nhay_cam">Da nhạy cảm</option>
                      <option value="da_thuong">Da thường</option>
                    </select>
                  </FormField>
                  <FormField label="Vị trí tổn thương">
                    <input type="text" className={inp} value={recForm.lesionLocation} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, lesionLocation: e.target.value }))} placeholder="VD: trán, má, cằm..." />
                  </FormField>
                </div>
                <FormField label="Hướng điều trị">
                  <textarea rows={2} className={`${inp} resize-none`} value={recForm.treatment} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, treatment: e.target.value }))} placeholder="Phác đồ điều trị, lưu ý..." />
                </FormField>
                <FormField label="Ghi chú">
                  <input type="text" className={inp} value={recForm.note} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, note: e.target.value }))} placeholder="Ghi chú thêm (nếu có)..." />
                </FormField>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                    <input type="checkbox" checked={hasFollowUp} disabled={readOnly} onChange={e => setHasFollowUp(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#1a3a5c]" />
                    <span className="font-medium">Hẹn tái khám</span>
                  </label>
                  {hasFollowUp && <input type="date" className={`${inp} flex-1`} min={todayStr()} value={recForm.followUpDate} disabled={readOnly} onChange={e => setRecForm(f => ({ ...f, followUpDate: e.target.value }))} />}
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenPres(v => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${openPres ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="font-semibold flex-1 text-left">Toa thuốc</span>
                    {prescriptions.length > 0 && <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">{prescriptions.length} đơn đã lưu</span>}
                    {presItems.length > 0 && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">+{presItems.length} thuốc mới</span>}
                  </button>

                  {openPres && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                      {prescriptions.length > 0 && (
                        <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                          <div className="text-xs text-blue-800">Đã lưu <strong>{prescriptions.length}</strong> đơn thuốc (Tổng <strong>{prescriptions.flatMap(p => p.items).length}</strong> loại thuốc).</div>
                          <button type="button" onClick={handlePrintAll} className="flex items-center gap-1.5 bg-[#1a3a5c] hover:bg-[#0f2540] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            In toa thuốc (A6)
                          </button>
                        </div>
                      )}

                      {prescriptions.map((p, pi) => (
                        <div key={p.id} className="rounded-xl border border-green-100 bg-green-50/50 overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-100/60 border-b border-green-100">
                            <span className="text-xs font-bold text-green-700">✓ Đơn thuốc #{pi + 1}</span>
                            {p.note && <span className="text-[11px] text-green-600 italic flex-1 truncate">— {p.note}</span>}
                            {!readOnly && (
                              <button type="button" onClick={() => delPres.openWith(p.id)} className="ml-auto text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Xóa đơn thuốc">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                          <div className="p-2 space-y-1">
                            {p.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-xs px-2 py-1.5 bg-white rounded-lg">
                                <span className="font-semibold text-gray-700">{it.medicineName}</span>
                                <span className="text-gray-400">{formatInstruction(it.dosage, it.frequency, it.duration)}{it.quantity ? ` · Số lượng: ${it.quantity}` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {!readOnly && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50/30 overflow-hidden">
                          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                            <span className="text-xs font-bold text-amber-700">{prescriptions.length > 0 ? `+ Thêm đơn thuốc #${prescriptions.length + 1}` : 'Kê đơn thuốc'}</span>
                          </div>
                          <div className="p-3 space-y-3">
                            <div className="relative">
                              <input type="text" className={`${inp} text-xs py-2`} value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder="🔍  Tìm tên thuốc..." />
                              {medSearch && filteredMeds.length > 0 && (
                                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                  {filteredMeds.map(m => (
                                    <button key={m.id} onClick={() => addMed(m)} className="w-full px-3 py-2.5 text-left text-xs hover:bg-blue-50 flex justify-between items-center transition-colors">
                                      <span className="font-medium text-gray-800">{m.name}</span>
                                      <span className="text-gray-400">{m.unit ?? m.category}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {presItems.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold text-gray-500 w-6">#</th>
                                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Thuốc</th>
                                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Liều</th>
                                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Tần suất</th>
                                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Ngày</th>
                                      <th className="px-2 py-2 text-left font-semibold text-gray-500">SL</th>
                                      <th className="px-2 py-2 w-6" />
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {presItems.map((it, i) => (
                                      <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                        <td className="px-3 py-2 font-medium text-gray-700 max-w-[90px]"><div className="truncate" title={it.medicineName}>{it.medicineName}</div></td>
                                        {(['dosage', 'frequency', 'duration'] as const).map(k => (
                                          <td key={k} className="px-2 py-2">
                                            <input type="text" value={it[k] as string} onChange={e => updatePres(i, k, e.target.value)} className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#1a3a5c]" placeholder="..." />
                                          </td>
                                        ))}
                                        <td className="px-2 py-2">
                                          <input type="number" value={it.quantity} min={1} onChange={e => updatePres(i, 'quantity', Number(e.target.value))} className="w-12 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#1a3a5c]" />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <button onClick={() => removePres(i)} className="text-red-400 hover:text-red-600">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <input type="text" className={`${inp} text-xs py-2`} value={presNote} onChange={e => setPresNote(e.target.value)} placeholder="Ghi chú đơn thuốc (nếu có)..." />

                            <button onClick={savePrescription} disabled={savingPres || presItems.length === 0} className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-40">
                              {savingPres ? 'Đang lưu...' : `💊  Lưu đơn thuốc${prescriptions.length > 0 ? ` #${prescriptions.length + 1}` : ''}`}
                            </button>
                          </div>
                        </div>
                      )}

                      {readOnly && prescriptions.length === 0 && <p className="text-xs text-gray-400 italic text-center py-1">Không có đơn thuốc</p>}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-sm">🖼️</span>
                    <span className="text-sm font-bold text-gray-700 flex-1">Ảnh tổn thương da</span>
                    {images.length > 0 && <span className="text-[10px] bg-[#1a3a5c] text-white px-2 py-0.5 rounded-full font-bold">{images.length} ảnh</span>}
                  </div>
                  <div className="p-4 space-y-3">
                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {images.map(img => (
                          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                            <img src={img.imageUrl} alt={img.note ?? 'Ảnh tổn thương'} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightbox(img)} />
                            {!readOnly && <button onClick={() => { deleteImage(img); if (lightbox?.id === img.id) setLightbox(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] hover:bg-red-600">✕</button>}
                            {img.note && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">{img.note}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {!readOnly && (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => { uploadImages(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-[#1a3a5c] hover:text-[#1a3a5c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          {uploadingImg ? (
                            <><div className="w-4 h-4 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />Đang tải lên... ({uploadProgress}%)</>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {record?.id ? 'Thêm ảnh tổn thương' : 'Thêm ảnh (tự động lưu hồ sơ)'}
                            </>
                          )}
                        </button>
                        <p className="text-[11px] text-gray-400 text-center">JPG, PNG, WebP · Tối đa 15MB / ảnh · Tối đa 10 ảnh 1 lần</p>
                      </>
                    )}
                    {images.length === 0 && readOnly && <p className="text-xs text-gray-400 italic text-center py-2">Không có ảnh tổn thương</p>}
                  </div>
                </div>

                {success && <div className="text-green-700 text-sm bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">✓ {success}</div>}
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">✕</button>
                  </div>
                )}

                {!isDone ? (
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => saveRecord()} disabled={saving} className="flex-1 border-2 border-[#1a3a5c] text-[#1a3a5c] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50">
                      {saving ? 'Đang lưu...' : record?.id ? '📝  Cập nhật hồ sơ' : '📝  Lưu hồ sơ'}
                    </button>
                    <button onClick={handleFinish} disabled={finishing || saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {finishing && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                      {finishing ? 'Đang xử lý...' : '✓  Hoàn tất khám'}
                    </button>
                  </div>
                ) : editing ? (
                  <div className="flex gap-3 pt-1">
                    <button onClick={async () => { if (await saveRecord() != null) setEditing(false); }} disabled={saving} className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-colors disabled:opacity-50">
                      {saving ? 'Đang lưu...' : '💾  Lưu thay đổi'}
                    </button>
                    <button onClick={() => setEditing(false)} disabled={saving} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setEditing(true)} className="flex-1 border-2 border-[#1a3a5c] text-[#1a3a5c] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                      ✏️  Sửa lại hồ sơ
                    </button>
                    <Link to="/doctor/today" className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">← Quay lại</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {lightbox && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <img src={lightbox.imageUrl} alt={lightbox.note ?? 'Ảnh tổn thương'} className="w-full rounded-xl object-contain max-h-[80vh]" />
              {lightbox.note && <p className="text-white text-sm text-center mt-3 opacity-80">{lightbox.note}</p>}
              <button onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-gray-100 font-bold text-sm">✕</button>
              {images.length > 1 && (
                <>
                  <button onClick={() => { const idx = images.findIndex(i => i.id === lightbox.id); setLightbox(images[(idx - 1 + images.length) % images.length]); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">‹</button>
                  <button onClick={() => { const idx = images.findIndex(i => i.id === lightbox.id); setLightbox(images[(idx + 1) % images.length]); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">›</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {printData && (
        <PrescriptionPrint
          patientName={displayName}
          patientPhone={displayPhone}
          doctorName={apt.doctor?.user?.name || ''}
          diagnosis={recForm.diagnosis || undefined}
          data={printData}
        />
      )}

      {delPres.isOpen && (
        <ConfirmDialog
          title="Xóa đơn thuốc"
          message="Bạn có chắc chắn muốn xóa đơn thuốc này không?"
          confirmLabel="Xóa đơn"
          loadingLabel="Đang xóa..."
          loading={deletingPres}
          onClose={delPres.close}
          onConfirm={confirmDeletePres}
        />
      )}
    </>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-xs text-gray-400 w-20 flex-shrink-0 mt-0.5">{label}:</span>
      <span className={`text-xs font-medium flex-1 ${highlight ? 'text-red-600' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  );
}

function HistoryRow({ record }: { record: HistoryRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
        <div>
          <div className="text-xs font-semibold text-gray-700">{record.appointment?.date ? fmtExamDate(record.appointment.date) : fmtExamDate(record.createdAt)}</div>
          {record.appointment?.service && <div className="text-[11px] text-gray-400 mt-0.5">{record.appointment.service.name}</div>}
        </div>
        <svg className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-50 space-y-1 text-xs text-gray-500">
          {record.symptoms && <p><span className="font-semibold text-gray-600">TC:</span> {record.symptoms}</p>}
          {record.diagnosis && <p><span className="font-semibold text-gray-600">CĐ:</span> {record.diagnosis}</p>}
          {record.treatment && <p><span className="font-semibold text-gray-600">ĐT:</span> {record.treatment}</p>}
        </div>
      )}
    </div>
  );
}
