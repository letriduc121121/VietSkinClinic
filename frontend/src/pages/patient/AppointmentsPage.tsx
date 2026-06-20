import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import { usePatientAppointments } from '@/features/appointments/hooks/usePatientAppointments';
import { PatientAppointmentCard } from '@/features/appointments/components/PatientAppointmentCard';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'done', label: 'Đã khám' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const matchTab = (a: Appointment, tab: string) => {
  if (tab === 'upcoming') return ['pending', 'confirmed', 'checked_in', 'in_progress'].includes(a.status);
  if (tab === 'done') return a.status === 'done';
  if (tab === 'cancelled') return ['cancelled', 'no_show'].includes(a.status);
  return true;
};

export default function AppointmentsPage() {
  const { appointments, loading, cancel } = usePatientAppointments();
  const [tab, setTab] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const cancelDisc = useDisclosure<Appointment>();
  const [cancelling, setCancelling] = useState(false);

  const confirmCancel = async () => {
    if (!cancelDisc.data) return;
    setCancelling(true);
    try { await cancel(cancelDisc.data.id); cancelDisc.close(); }
    finally { setCancelling(false); }
  };

  const hasDateFilter = !!(fromDate || toDate);
  const dateFiltered = appointments.filter(a => {
    const d = a.date?.slice(0, 10) ?? '';
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });
  const filtered = dateFiltered.filter(a => matchTab(a, tab));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch hẹn của tôi</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasDateFilter
              ? `${dateFiltered.length} / ${appointments.length} lịch hẹn trong khoảng ngày`
              : `${appointments.length} lịch hẹn tổng cộng`}
          </p>
        </div>
        <Link to="/patient/booking" className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Đặt lịch mới
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => {
            const count = dateFiltered.filter(a => matchTab(a, t.key)).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-gray-500 border border-gray-100 hover:border-primary/30'
                }`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
          <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-xs text-gray-700 focus:outline-none" aria-label="Từ ngày" />
          <span className="text-gray-300 text-xs">→</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)} className="bg-transparent text-xs text-gray-700 focus:outline-none" aria-label="Đến ngày" />
          {hasDateFilter && (
            <button onClick={() => { setFromDate(''); setToDate(''); }} className="ml-1 text-gray-400 hover:text-red-500 transition-colors" title="Xoá bộ lọc ngày">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-bold text-lg">Không có lịch hẹn nào</h3>
          <p className="text-sm text-gray-500 mt-1">
            {hasDateFilter
              ? 'Không có lịch hẹn trong khoảng ngày đã chọn.'
              : tab === 'upcoming' ? 'Bạn chưa có lịch hẹn sắp tới.' : 'Chưa có dữ liệu cho danh mục này.'}
          </p>
          {hasDateFilter && (
            <button onClick={() => { setFromDate(''); setToDate(''); }} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              ✕ Xoá bộ lọc ngày
            </button>
          )}
          {!hasDateFilter && tab === 'upcoming' && (
            <Link to="/patient/booking" className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">
              Đặt lịch ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => (
            <PatientAppointmentCard key={apt.id} apt={apt} onCancel={cancelDisc.openWith} />
          ))}
        </div>
      )}

      {cancelDisc.isOpen && cancelDisc.data && (
        <ConfirmDialog
          title="Huỷ lịch hẹn"
          message={<>Bạn có chắc muốn huỷ lịch hẹn với <strong>{cancelDisc.data.doctor.user.name}</strong> lúc {cancelDisc.data.time}?</>}
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
