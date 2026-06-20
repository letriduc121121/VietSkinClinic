import { useState } from 'react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useReceptionDesk } from '@/features/appointments/hooks/useReceptionDesk';
import { statusBadge, STATUS_PRIORITY } from '@/features/appointments/lib/status';
import { QueuePanel } from '@/features/appointments/components/QueuePanel';
import { WalkinDialog } from '@/features/appointments/components/WalkinDialog';
import { PaymentDialog } from '@/features/invoices/components/PaymentDialog';
import type { Appointment } from '@/features/appointments/types/appointment.types';

export default function AppointmentListPage() {
  const {
    apts, doctors, services, loading, actioning,
    date, setDate, doctorId, setDoctorId, status, setStatus,
    queue, queueLoading, bookingAlert, dismissAlert,
    reload, reloadQueue, confirm: approve, checkin, cancel,
  } = useReceptionDesk();

  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const walkin = useDisclosure();
  const cancelDisc = useDisclosure<Appointment>();
  const [cancelling, setCancelling] = useState(false);
  const [payingApt, setPayingApt] = useState<Appointment | null>(null);

  const handleSearch = () => { setSearchQuery(search); reload(); };

  const confirmCancel = async () => {
    if (!cancelDisc.data) return;
    setCancelling(true);
    try { await cancel(cancelDisc.data.id); cancelDisc.close(); }
    finally { setCancelling(false); }
  };

  const displayed = apts
    .filter(a => !searchQuery || a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.patientPhone?.includes(searchQuery))
    .sort((a, b) => {
      const pd = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
      return pd !== 0 ? pd : a.time.localeCompare(b.time);
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
          <p className="text-sm text-gray-500 mt-1">{displayed.length} lịch hẹn</p>
        </div>
        <button onClick={walkin.open} className="flex items-center gap-2 bg-[#1a3a5c] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Tạo phiếu khám
        </button>
      </div>

      {bookingAlert && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
            <span className="text-sm text-blue-800">
              Lịch mới: <strong>{bookingAlert.patientName}</strong>{' — '}
              <button className="font-bold underline hover:text-blue-600 transition-colors" onClick={() => { setDate(bookingAlert.date); dismissAlert(); }}>
                {bookingAlert.date.split('-').reverse().join('/')}
              </button>
              <span className="text-blue-500 text-xs ml-1">(bấm để xem)</span>
            </span>
          </div>
          <button onClick={dismissAlert} className="text-blue-400 hover:text-blue-700 ml-4 text-lg leading-none">×</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Tên bệnh nhân, SĐT..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                />
              </div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10" />
            </div>
            <div className="flex gap-2 items-center">
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)}
                className="flex-1 py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10">
                <option value="">Tất cả bác sĩ</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.user.name}</option>)}
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="flex-1 py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10">
                <option value="">Tất cả trạng thái</option>
                {Object.entries(statusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={reload} title="Làm mới" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-gray-500 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={handleSearch} className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:bg-[#15304e] transition-all flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <div className="col-span-1">Giờ</div>
              <div className="col-span-3">Bệnh nhân</div>
              <div className="col-span-2">SĐT</div>
              <div className="col-span-2">Bác sĩ</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-2">Thao tác</div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
            ) : displayed.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><div className="text-3xl mb-2">📋</div><p className="text-sm">Không tìm thấy lịch hẹn nào</p></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {displayed.map(apt => (
                  <div key={apt.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1">
                      <div className="font-bold text-sm text-[#1a3a5c]">{apt.time}</div>
                      {apt.queueNumber && <div className="text-[10px] text-teal-600 font-bold">STT #{apt.queueNumber}</div>}
                    </div>
                    <div className="col-span-3 pr-2">
                      <div className="font-semibold text-sm truncate">{apt.patientName}</div>
                      {apt.symptoms && <div className="text-xs text-gray-400 truncate">{apt.symptoms}</div>}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">{apt.patientPhone}</div>
                    <div className="col-span-2 text-sm text-gray-500 truncate">{apt.doctor.user.name}</div>
                    <div className="col-span-2">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold w-fit ${statusBadge[apt.status]?.cls}`}>{statusBadge[apt.status]?.label}</span>
                        {apt.status === 'done' && apt.invoice && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-600 w-fit">Đã thu tiền</span>}
                        {apt.status === 'done' && !apt.invoice && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-600 w-fit">Chưa thu tiền</span>}
                      </div>
                    </div>
                    <div className="col-span-2 flex gap-1.5 flex-wrap">
                      {apt.status === 'pending' && (
                        <button onClick={() => approve(apt.id)} disabled={actioning === apt.id}
                          className="text-xs px-2.5 py-1.5 bg-[#1a3a5c] text-white rounded-lg font-bold hover:bg-[#0f2540] transition-all disabled:opacity-50">
                          {actioning === apt.id ? '...' : 'Xác nhận'}
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => checkin(apt.id)} disabled={actioning === apt.id}
                          className="text-xs px-2.5 py-1.5 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 transition-all disabled:opacity-50">
                          {actioning === apt.id ? '...' : 'Check-in'}
                        </button>
                      )}
                      {apt.status === 'done' && !apt.invoice && (
                        <button onClick={() => setPayingApt(apt)} className="text-xs px-2.5 py-1.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all shadow-sm">Thu tiền</button>
                      )}
                      {['pending', 'confirmed'].includes(apt.status) && (
                        <button onClick={() => cancelDisc.openWith(apt)} disabled={actioning === apt.id}
                          className="text-xs px-2.5 py-1.5 border border-red-200 text-red-500 rounded-lg font-bold hover:bg-red-50 transition-all">Huỷ</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <QueuePanel queue={queue} loading={queueLoading} />
        </div>
      </div>

      {walkin.isOpen && (
        <WalkinDialog
          doctors={doctors}
          services={services}
          onClose={walkin.close}
          onCreated={() => { reload(); reloadQueue(); }}
        />
      )}

      {payingApt && (
        <PaymentDialog apt={payingApt} onClose={() => setPayingApt(null)} onSuccess={() => { setPayingApt(null); reload(); }} />
      )}

      {cancelDisc.isOpen && cancelDisc.data && (
        <ConfirmDialog
          title="Huỷ lịch hẹn"
          message={<>Huỷ lịch hẹn của <strong>{cancelDisc.data.patientName}</strong> lúc {cancelDisc.data.time}?</>}
          confirmLabel="Huỷ lịch"
          loadingLabel="Đang huỷ..."
          loading={cancelling}
          onClose={cancelDisc.close}
          onConfirm={confirmCancel}
        />
      )}
    </div>
  );
}
