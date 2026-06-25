import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { usePatientDashboard } from '@/features/dashboard/hooks/usePatientDashboard';

const UPCOMING = ['pending', 'confirmed', 'checked_in', 'in_progress'];

const STATUS: Record<string, { label: string; cls: string }> = {
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-green-100 text-green-700' },
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-blue-100 text-blue-700'   },
  in_progress: { label: 'Đang khám',    cls: 'bg-indigo-100 text-indigo-700'},
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const dow = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][date.getDay()];
  return `${dow}, ${d}/${m}/${y}`;
}

function fmtRecordDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const { appointments, records, notifications, profile, loading, cancelling, cancel } = usePatientDashboard();
  const cancelDisc = useDisclosure<number>();

  const upcoming = appointments
    .filter(a => UPCOMING.includes(a.status) && a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const nextAppt      = upcoming[0] ?? null;
  const doneCount     = appointments.filter(a => a.status === 'done').length;
  const recentRecords = records.slice(0, 3);
  const unread        = notifications.filter(n => !n.isRead).length;

  const confirmCancel = async () => {
    if (cancelDisc.data == null) return;
    await cancel(cancelDisc.data);
    cancelDisc.close();
  };

  const stats = [
    { label: 'Lịch hẹn sắp tới', value: loading ? '–' : String(upcoming.length), color: 'text-[#1a3a5c]' },
    { label: 'Tổng lần đã khám',  value: loading ? '–' : String(doneCount),       color: 'text-green-600' },
    { label: 'Lịch sử khám',     value: loading ? '–' : String(records.length),  color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <Link
          to="/patient/booking"
          className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0f2540] transition-colors"
        >
          Đặt lịch khám
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Next appointment */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900">Lịch hẹn sắp tới</h2>
              <Link to="/patient/appointments" className="text-xs text-[#1a3a5c] font-semibold hover:underline">
                Xem tất cả →
              </Link>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>
              ) : nextAppt ? (
                <div className="bg-[#1a3a5c] rounded-xl p-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-3">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS[nextAppt.status]?.cls ?? 'bg-white/20 text-white'}`}>
                        {STATUS[nextAppt.status]?.label ?? nextAppt.status}
                      </span>
                      <div>
                        <div className="text-2xl font-bold">{nextAppt.time}</div>
                        <div className="text-blue-100 text-sm mt-0.5">{fmtDate(nextAppt.date)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{nextAppt.doctor?.user?.name}</div>
                        {nextAppt.service && (
                          <div className="text-sm text-blue-200">{nextAppt.service.name}</div>
                        )}
                        {nextAppt.queueNumber && (
                          <div className="text-sm text-blue-200">Số thứ tự: #{nextAppt.queueNumber}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <Link
                        to="/patient/appointments"
                        className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-sm font-semibold transition-colors text-center"
                      >
                        Xem chi tiết
                      </Link>
                      {(nextAppt.status === 'pending' || nextAppt.status === 'confirmed') && (
                        <button
                          onClick={() => cancelDisc.openWith(nextAppt.id)}
                          disabled={cancelling}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm text-blue-200 transition-colors disabled:opacity-50"
                        >
                          Huỷ lịch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-gray-500 text-sm">Bạn chưa có lịch hẹn sắp tới</p>
                  <Link
                    to="/patient/booking"
                    className="mt-3 text-sm text-[#1a3a5c] font-semibold hover:underline"
                  >
                    Đặt lịch ngay →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent records */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900">Lịch sử khám gần đây</h2>
              <Link to="/patient/records" className="text-xs text-[#1a3a5c] font-semibold hover:underline">
                Xem hồ sơ →
              </Link>
            </div>

            {loading ? (
              <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>
            ) : recentRecords.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Chưa có lịch sử khám nào</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentRecords.map((r) => (
                  <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.diagnosis ?? 'Chưa có chẩn đoán'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.doctor?.user?.name ?? 'Bác sĩ'} · {fmtRecordDate(r.appointment?.date ?? r.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-base text-gray-900 mb-4">Truy cập nhanh</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Đặt lịch khám', to: '/patient/booking' },
                { label: 'Lịch hẹn',      to: '/patient/appointments' },
                { label: 'Bệnh án',       to: '/patient/records' },
                { label: 'Hồ sơ cá nhân', to: '/patient/profile' },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-[#1a3a5c] hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900">Thông báo</h2>
              {unread > 0 && (
                <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </div>

            {loading ? (
              <div className="h-20 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Không có thông báo nào</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-5 py-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini profile card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-base flex-shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.phone}</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Nhóm máu', value: profile?.patientProfile?.bloodType ?? null },
                { label: 'Dị ứng',   value: profile?.patientProfile?.allergies  ?? null },
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{f.label}</span>
                  {f.value
                    ? <span className="font-medium text-gray-700">{f.value}</span>
                    : <span className="text-gray-300 italic">Chưa cập nhật</span>
                  }
                </div>
              ))}
            </div>
            <Link
              to="/patient/profile"
              className="mt-3 w-full flex items-center justify-center text-xs text-[#1a3a5c] font-semibold py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cập nhật hồ sơ →
            </Link>
          </div>
        </div>
      </div>

      {cancelDisc.isOpen && (
        <ConfirmDialog
          title="Huỷ lịch hẹn"
          message="Bạn có chắc muốn huỷ lịch hẹn này?"
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
