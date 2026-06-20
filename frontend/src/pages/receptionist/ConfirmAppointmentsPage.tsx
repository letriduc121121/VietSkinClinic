import { useState } from 'react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import { usePendingApprovals } from '@/features/appointments/hooks/usePendingApprovals';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const formatDate = (iso: string) => {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const formatMoney = (v: string | number) => Number(v).toLocaleString('vi-VN') + 'đ';

const relativeLabel = (iso: string) => {
  const dateStr = iso.slice(0, 10);
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Hôm nay';
  if (dateStr === tomorrow) return 'Ngày mai';
  return formatDate(iso);
};

export default function ConfirmAppointmentsPage() {
  const { apts, loading, actioning, recentConfirmed, reload, confirm: approve, reject, confirmAll } = usePendingApprovals();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [detail, setDetail] = useState<Appointment | null>(null);
  const rejectDisc = useDisclosure<Appointment>();
  const confirmAllDisc = useDisclosure();
  const [rejecting, setRejecting] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);

  const handleConfirm = async (apt: Appointment) => {
    await approve(apt);
    if (detail?.id === apt.id) setDetail(null);
  };

  const doReject = async () => {
    if (!rejectDisc.data) return;
    setRejecting(true);
    try {
      await reject(rejectDisc.data.id);
      if (detail?.id === rejectDisc.data.id) setDetail(null);
      rejectDisc.close();
    } finally { setRejecting(false); }
  };

  const doConfirmAll = async () => {
    setConfirmingAll(true);
    try { await confirmAll(displayed); confirmAllDisc.close(); }
    finally { setConfirmingAll(false); }
  };

  const handleSearch = () => { setSearchQuery(searchInput); reload(); };
  const handleClearSearch = () => { setSearchInput(''); setSearchQuery(''); };

  const displayed = apts.filter(a =>
    !searchQuery ||
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.patientPhone?.includes(searchQuery) ||
    a.doctor.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const grouped = displayed.reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = a.date.slice(0, 10);
    (acc[key] ??= []).push(a);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Duyệt lịch hẹn</h1>
        <p className="text-sm text-gray-500 mt-1">Duyệt các lịch đặt khám online từ bệnh nhân — ưu tiên gần giờ khám nhất.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm bệnh nhân, SĐT, bác sĩ..."
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 rounded-xl text-sm border border-transparent focus:border-[#1a3a5c]/30 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
              />
              {searchInput && (
                <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:bg-[#15304e] transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Tìm kiếm
            </button>
            <button onClick={reload} title="Làm mới dữ liệu" className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {displayed.length > 1 && (
              <button onClick={confirmAllDisc.open} disabled={actioning === -1}
                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-600 transition-all shadow-md disabled:opacity-60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Xác nhận tất cả ({displayed.length})
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
          ) : displayed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-gray-700">{apts.length === 0 ? 'Không có lịch hẹn chờ duyệt' : 'Không tìm thấy kết quả'}</h3>
              <p className="text-sm text-gray-400 mt-1">{apts.length === 0 ? 'Tất cả lịch hẹn đã được xử lý.' : 'Thử tìm kiếm với từ khoá khác.'}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedDates.map(date => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${date === todayISO() ? 'bg-[#1a3a5c] text-white' : 'bg-gray-100 text-gray-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {relativeLabel(date)}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{grouped[date].length} lịch hẹn</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <div className="space-y-2.5">
                    {grouped[date].map(apt => (
                      <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4">
                        <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {apt.patientName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{apt.patientName}</span>
                            <span className="text-xs text-gray-400">{apt.patientPhone}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {apt.doctor.user.name}
                            {apt.service && <> · {apt.service.name}</>}
                            {' · '}<span className="font-semibold text-[#1a3a5c]">{apt.time}</span>
                          </div>
                          {apt.symptoms && <div className="text-xs text-gray-400 mt-0.5 truncate">Triệu chứng: {apt.symptoms}</div>}
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold flex-shrink-0 hidden sm:inline-block">Chờ duyệt</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => setDetail(apt)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Xem chi tiết">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => rejectDisc.openWith(apt)} disabled={actioning === apt.id}
                            className="text-xs px-3 py-2 border border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all disabled:opacity-50">
                            Từ chối
                          </button>
                          <button onClick={() => handleConfirm(apt)} disabled={actioning === apt.id}
                            className="text-xs px-4 py-2 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {actioning === apt.id
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-base">Thống kê chờ duyệt</h2>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Tổng chờ" value={apts.length} color="amber" />
              <MiniStat label="Hôm nay" value={apts.filter(a => a.date.slice(0, 10) === todayISO()).length} color="blue" />
              <MiniStat label="Ngày mai" value={apts.filter(a => {
                const tom = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 86400000).toISOString().slice(0, 10);
                return a.date.slice(0, 10) === tom;
              }).length} color="indigo" />
              <MiniStat label="Sau đó" value={apts.filter(a => {
                const dayAfter = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 86400000 * 2).toISOString().slice(0, 10);
                return a.date.slice(0, 10) >= dayAfter;
              }).length} color="purple" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base">Đã xác nhận gần đây</h2>
              <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-bold">{recentConfirmed.length}</span>
            </div>

            {recentConfirmed.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">Chưa có lịch hẹn nào được xác nhận trong phiên này</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                {recentConfirmed.map(r => (
                  <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.name}</div>
                      <div className="text-xs text-gray-400 truncate">{relativeLabel(r.date)} · {r.time} · {r.doctor}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold flex-shrink-0">Đã duyệt</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-base">Chi tiết lịch hẹn</h2>
                <p className="text-xs text-gray-400 mt-0.5">#{detail.id}</p>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex justify-center">
                <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Đang chờ xác nhận
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bệnh nhân</div>
                <Row label="Họ tên" value={detail.patientName} bold />
                <Row label="Số điện thoại" value={detail.patientPhone ?? '—'} />
                {detail.patientEmail && <Row label="Email" value={detail.patientEmail} />}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lịch khám</div>
                <Row label="Ngày" value={`${relativeLabel(detail.date)} (${formatDate(detail.date)})`} bold />
                <Row label="Giờ" value={detail.time} bold />
                <Row label="Bác sĩ" value={detail.doctor.user.name} />
                {detail.service && (
                  <>
                    <Row label="Dịch vụ" value={detail.service.name} />
                    <Row label="Phí dịch vụ" value={formatMoney(detail.service.price ?? 0)} />
                  </>
                )}
              </div>

              {detail.symptoms && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Triệu chứng</div>
                  <p className="text-sm text-gray-700">{detail.symptoms}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => rejectDisc.openWith(detail)} disabled={actioning === detail.id}
                  className="flex-1 py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Từ chối
                </button>
                <button onClick={() => handleConfirm(detail)} disabled={actioning === detail.id}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
                  {actioning === detail.id
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  Duyệt lịch hẹn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {rejectDisc.isOpen && rejectDisc.data && (
        <ConfirmDialog
          title="Từ chối lịch hẹn"
          message={<>Từ chối lịch hẹn của <strong>{rejectDisc.data.patientName}</strong>? Bệnh nhân sẽ được thông báo huỷ.</>}
          confirmLabel="Từ chối"
          loadingLabel="Đang xử lý..."
          loading={rejecting}
          onClose={rejectDisc.close}
          onConfirm={doReject}
        />
      )}

      {confirmAllDisc.isOpen && (
        <ConfirmDialog
          title="Duyệt tất cả lịch hẹn"
          message={<>Xác nhận tất cả <strong>{displayed.length}</strong> lịch hẹn đang chờ?</>}
          variant="primary"
          confirmLabel="Duyệt tất cả"
          loadingLabel="Đang duyệt..."
          loading={confirmingAll}
          onClose={confirmAllDisc.close}
          onConfirm={doConfirmAll}
        />
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? 'font-bold text-[#1a3a5c]' : 'font-semibold'}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const cfg: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-3 ${cfg[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
