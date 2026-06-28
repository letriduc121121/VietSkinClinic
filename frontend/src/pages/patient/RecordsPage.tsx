import { useState } from 'react';
import type { Prescription } from '@/features/medical-records/types/medical-record.types';
import type { MedicalRecordImage } from '@/features/medical-record-images/types/medical-record-image.types';
import { usePatientRecords } from '@/features/medical-records/hooks/usePatientRecords';
import { formatInstruction, fmtExamDate as fmtDate } from '@/features/medical-records/lib/exam';
import { ArrowRight, Stethoscope, Pill } from 'lucide-react';

export default function RecordsPage() {
  const { records, loading, selected, detailLoading, loadDetail } = usePatientRecords();
  const [lightbox, setLightbox] = useState<MedicalRecordImage | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const images: MedicalRecordImage[] = selected?.images ?? [];
  const prescriptions: Prescription[] = selected?.prescriptions ?? [];

  const filteredRecords = records.filter(r => {
    const recordDateStr = r.appointment?.date || r.createdAt.split('T')[0];
    if (fromDate && recordDateStr < fromDate) return false;
    if (toDate && recordDateStr > toDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử khám</h1>
        <p className="text-sm text-gray-500 mt-1">Lịch sử khám và kết quả điều trị của bạn tại phòng khám VietSkin.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center shadow-sm">
          <h3 className="font-bold text-lg text-gray-800">Chưa có lịch sử khám nào</h3>
          <p className="text-sm text-gray-500 mt-1">Lịch sử khám bệnh của bạn sẽ xuất hiện tại đây sau lần khám đầu tiên.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Danh sách lịch sử khám (Bên trái) ── */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* Bộ lọc ngày khám */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#1a3a5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Bộ lọc ngày khám</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-450 uppercase mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1a3a5c] bg-white text-gray-755"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-450 uppercase mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1a3a5c] bg-white text-gray-755"
                  />
                </div>
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="w-full text-center text-xs text-red-500 hover:text-red-700 font-bold pt-1 transition-colors"
                >
                  ✕ Xóa bộ lọc ngày
                </button>
              )}
            </div>

            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500 shadow-sm">
                Không tìm thấy lịch sử khám trong khoảng ngày đã chọn.
              </div>
            ) : (
              filteredRecords.map(r => {
                const isSelected = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => loadDetail(r.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 shadow-sm relative overflow-hidden ${
                      isSelected
                        ? 'border-[#1a3a5c] bg-[#1a3a5c]/5 ring-1 ring-[#1a3a5c]'
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow'
                    }`}
                  >
                  {/* Thanh màu bên trái khi được chọn */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1a3a5c]" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-[#1a3a5c] text-white' : 'bg-gray-50 text-gray-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm">
                        {r.appointment?.date ? fmtDate(r.appointment.date) : fmtDate(r.createdAt)}
                        {r.appointment?.time ? ` · ${r.appointment.time.slice(0, 5)}` : ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span>Bác sĩ phụ trách:</span>
                        <span className="font-medium text-gray-700">{r.doctor?.user.name ?? 'Bác sĩ VietSkin'}</span>
                      </div>
                      {r.diagnosis && (
                        <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg italic line-clamp-1 border border-gray-100">
                          {r.diagnosis}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {r.appointment?.service && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-[#1a3a5c]/5 text-[#1a3a5c] rounded-md">
                            {r.appointment.service.name}
                          </span>
                        )}
                        {(r.images?.length ?? 0) > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                            {r.images!.length} ảnh tổn thương
                          </span>
                        )}
                        {(r.prescriptions?.length ?? 0) > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                            {r.prescriptions!.length} đơn thuốc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            }))}
          </div>

          {/* ── Chi tiết lịch sử khám (Bên phải) ── */}
          <div className="lg:col-span-3">
            {detailLoading ? (
              <div className="flex justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !selected ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-500">Chọn một lịch sử khám bên trái để xem chi tiết kết quả</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Header chi tiết */}
                <div className="border-b border-gray-100 p-6 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-2xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ngày khám</div>
                        <div className="text-lg font-bold text-gray-800 mt-0.5">
                          {selected.appointment?.date ? fmtDate(selected.appointment.date) : fmtDate(selected.createdAt)}
                          {selected.appointment?.time ? ` · ${selected.appointment.time.slice(0, 5)}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:text-right">
                      <div className="hidden sm:block">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Bác sĩ phụ trách</div>
                        <div className="font-bold text-gray-800 mt-0.5">{selected.doctor?.user.name ?? 'Bác sĩ VietSkin'}</div>
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 border border-gray-200 flex-shrink-0">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div className="block sm:hidden">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Bác sĩ phụ trách</div>
                        <div className="font-bold text-gray-800 mt-0.5">{selected.doctor?.user.name ?? 'Bác sĩ VietSkin'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">

                  {/* Thông tin chẩn đoán & điều trị */}
                  <div className="grid gap-4.5">
                    {[
                      { 
                        label: 'Triệu chứng lâm sàng', 
                        value: selected.symptoms, 
                        icon: (
                          <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        ),
                        bgColor: 'bg-sky-50/40 border-sky-100'
                      },
                      { 
                        label: 'Chẩn đoán bệnh', 
                        value: selected.diagnosis, 
                        icon: (
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        ),
                        bgColor: 'bg-emerald-50/40 border-emerald-100'
                      },
                      { 
                        label: 'Phác đồ điều trị', 
                        value: selected.treatment, 
                        icon: (
                          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        ),
                        bgColor: 'bg-violet-50/40 border-violet-100'
                      },
                      { 
                        label: 'Ghi chú & Lời khuyên bác sĩ', 
                        value: selected.note, 
                        icon: (
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        ),
                        bgColor: 'bg-indigo-50/40 border-indigo-100'
                      },
                    ].map(f => (
                      <div key={f.label} className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {f.icon}
                          <span>{f.label}</span>
                        </div>
                        <div className={`text-sm rounded-xl px-4 py-3 leading-relaxed border ${f.bgColor} ${
                          f.value
                            ? 'text-gray-700 bg-white shadow-sm font-medium'
                            : 'text-gray-400 bg-gray-50/50 italic'
                        }`}>
                          {f.value || 'Chưa có thông tin'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tái khám */}
                  {selected.followUpDate && (
                    <div className="flex items-center gap-3.5 p-4 bg-amber-50/60 rounded-xl border border-amber-200/85 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Lịch tái khám dự kiến</div>
                        <div className="font-extrabold text-amber-900 text-sm mt-0.5">{fmtDate(selected.followUpDate)}</div>
                      </div>
                    </div>
                  )}

                  {/* ── Ảnh tổn thương ── */}
                  {images.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Ảnh tổn thương da</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {images.map(img => (
                          <div key={img.id}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 cursor-pointer group shadow-sm hover:shadow transition-shadow"
                            onClick={() => setLightbox(img)}
                          >
                            <img src={img.imageUrl} alt={img.note ?? 'Ảnh tổn thương'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            {img.note && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2.5 py-1.5 truncate text-center font-medium">
                                {img.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Đơn thuốc ── */}
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Đơn thuốc của bạn {prescriptions.length > 0 ? `(${prescriptions.length})` : ''}</span>
                    </div>
                    {prescriptions.length === 0 ? (
                      <div className="text-sm text-gray-400 italic bg-gray-50/50 rounded-xl px-4 py-3 border border-dashed border-gray-200">
                        Chưa có đơn thuốc nào được kê cho lượt khám này.
                      </div>
                    ) : (
                      prescriptions.map((p, pi) => (
                        <div key={p.id} className="rounded-2xl border border-amber-100/80 bg-amber-50/10 overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between px-4 py-3 bg-amber-50/50 border-b border-amber-100/80">
                            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><Pill className="w-4 h-4" /> Toa thuốc #{pi + 1}</span>
                            {p.note && <span className="text-xs text-amber-700 italic max-w-[200px] sm:max-w-xs truncate" title={p.note}>Lưu ý: {p.note}</span>}
                          </div>
                          <div className="divide-y divide-amber-100/50 bg-white">
                            {p.items.map((item, i) => (
                              <div key={item.id ?? i} className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-amber-50/10 transition-colors">
                                <div className="w-6 h-6 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-850 text-sm">{item.medicineName}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {formatInstruction(item.dosage, item.frequency, item.duration)}
                                    {item.quantity ? ` · Số lượng: ${item.quantity}` : ''}
                                  </div>
                                  {item.note && (
                                    <div className="text-xs text-amber-600 mt-1 bg-amber-50/40 px-2 py-1 rounded-md inline-block font-medium">
                                      * {item.note}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.imageUrl} alt={lightbox.note ?? 'Ảnh tổn thương'}
              className="w-full rounded-2xl object-contain max-h-[80vh]" />
            {lightbox.note && (
              <p className="text-white text-sm text-center mt-3 opacity-80">{lightbox.note}</p>
            )}
            <button onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-gray-100 font-bold">
              ✕
            </button>
            {images.length > 1 && (
              <>
                <button onClick={() => {
                  const idx = images.findIndex(i => i.id === lightbox.id);
                  setLightbox(images[(idx - 1 + images.length) % images.length]);
                }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70 text-lg">
                  ‹
                </button>
                <button onClick={() => {
                  const idx = images.findIndex(i => i.id === lightbox.id);
                  setLightbox(images[(idx + 1) % images.length]);
                }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70 text-lg">
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
