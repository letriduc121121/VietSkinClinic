import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDoctorHistory } from '@/features/medical-records/hooks/useDoctorHistory';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function HistoryPage() {
  const { items, loading, dateFrom, setDateFrom, dateTo, setDateTo, applyFilter, selected, selectedRecord, detailLoading, openDetail, closeDetail } = useDoctorHistory();
  const [search, setSearch] = useState('');

  const displayed = items.filter(a =>
    !search ||
    a.patientName.toLowerCase().includes(search.toLowerCase()) ||
    a.patientPhone?.includes(search)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Lịch sử ca khám</h1>
        <p className="text-sm text-gray-500 mt-1">Toàn bộ các ca khám đã hoàn thành</p>
      </div>

      <div className="flex gap-5">
        {/* LEFT: list */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Từ ngày</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Đến ngày</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20" />
            </div>
            <button onClick={applyFilter}
              className="px-5 py-2 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all">
              Lọc
            </button>
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tìm kiếm</label>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tên hoặc SĐT..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20" />
            </div>
            <div className="text-xs text-gray-400 self-end pb-2">{displayed.length} ca khám</div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-bold text-[11px] uppercase text-gray-500">Ngày</th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase text-gray-500">Giờ</th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase text-gray-500">Bệnh nhân</th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase text-gray-500">SĐT</th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase text-gray-500">Dịch vụ</th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase text-gray-500 text-center">STT</th>
                  <th className="px-5 py-3 font-bold text-[11px] uppercase text-gray-500 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                    </div>
                    Đang tải...
                  </td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-sm">Không có ca khám nào trong khoảng thời gian này</p>
                  </td></tr>
                ) : (
                  displayed.map(apt => (
                    <tr key={apt.id}
                      onClick={() => openDetail(apt.id)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selected?.id === apt.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{fmtDate(apt.date)}</td>
                      <td className="px-4 py-3.5 font-bold text-[#1a3a5c]">{apt.time}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{apt.patientName}</td>
                      <td className="px-4 py-3.5 text-gray-500">{apt.patientPhone ?? '–'}</td>
                      <td className="px-4 py-3.5 text-gray-600 truncate max-w-[140px]">{apt.service?.name ?? '–'}</td>
                      <td className="px-4 py-3.5 text-center">
                        {apt.queueNumber
                          ? <span className="text-xs font-bold text-teal-600">#{apt.queueNumber}</span>
                          : <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); openDetail(apt.id); }}
                          className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto hover:bg-[#1a3a5c] hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        {(selected || detailLoading) && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-sm">Chi tiết lịch sử khám</h2>
                <button onClick={closeDetail} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selected && (
                <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Appointment info */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thông tin lịch hẹn</div>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                      <Row label="Bệnh nhân" value={selected.patientName} />
                      <Row label="SĐT" value={selected.patientPhone ?? '–'} />
                      <Row label="Ngày" value={fmtDate(selected.date)} />
                      <Row label="Giờ" value={selected.time} />
                      {selected.service && <Row label="Dịch vụ" value={selected.service.name} />}
                      {selected.queueNumber && <Row label="STT" value={`#${selected.queueNumber}`} />}
                    </div>
                  </div>

                  {selectedRecord ? (
                    <>
                      {/* Medical record */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lịch sử khám</div>
                        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                          {selectedRecord.symptoms       && <Row label="Triệu chứng"    value={selectedRecord.symptoms} />}
                          {selectedRecord.skinType       && <Row label="Loại da"        value={selectedRecord.skinType} />}
                          {selectedRecord.lesionLocation && <Row label="Vị trí tổn thương" value={selectedRecord.lesionLocation} />}
                          {selectedRecord.diagnosis      && <Row label="Chẩn đoán"      value={selectedRecord.diagnosis} />}
                          {selectedRecord.treatment      && <Row label="Điều trị"       value={selectedRecord.treatment} />}
                          {selectedRecord.note           && <Row label="Ghi chú"        value={selectedRecord.note} />}
                          {selectedRecord.followUpDate   && (
                            <Row label="Tái khám" value={fmtDate(selectedRecord.followUpDate)} />
                          )}
                        </div>
                      </div>

                      {/* Prescriptions */}
                      {(selectedRecord.prescriptions ?? []).some(p => p.items.length > 0) && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Đơn thuốc</div>
                          <div className="space-y-1.5">
                            {(selectedRecord.prescriptions ?? []).flatMap(p => p.items).map((item, i) => (
                              <div key={i} className="bg-blue-50 rounded-xl p-3 text-sm">
                                <div className="font-semibold text-gray-800">{item.medicineName}</div>
                                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                  {item.dosage    && <div>Liều: {item.dosage}</div>}
                                  {item.frequency && <div>Tần suất: {item.frequency}</div>}
                                  {item.duration  && <div>Thời gian: {item.duration}</div>}
                                  {item.quantity  && <div>Số lượng: {item.quantity}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-6 text-center text-gray-400 text-sm">
                      <div className="text-2xl mb-1">📄</div>
                      Chưa có lịch sử khám
                    </div>
                  )}

                  {/* Sửa lại ca khám */}
                  <Link
                    to={`/doctor/examine/${selected.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {selectedRecord ? 'Sửa lại hồ sơ khám' : 'Lập hồ sơ khám'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}
