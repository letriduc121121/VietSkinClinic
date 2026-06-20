import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useReceptionistDashboard } from '@/features/dashboard/hooks/useReceptionistDashboard';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700' },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600' },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-500' },
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const { apts, invoices, loading, confirming, confirm: handleConfirm, today } = useReceptionistDashboard();
  const todayLabel = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.amount), 0);
  const byMethod = invoices.reduce((acc, inv) => {
    acc[inv.method] = (acc[inv.method] || 0) + Number(inv.amount);
    return acc;
  }, {} as Record<string, number>);

  const methodLabel: Record<string, string> = {
    cash: 'Tiền mặt', qr_code: 'QR Code', bank_transfer: 'Chuyển khoản', card: 'Thẻ'
  };

  const counts = {
    total:      apts.length,
    pending:    apts.filter(a => a.status === 'pending').length,
    confirmed:  apts.filter(a => a.status === 'confirmed').length,
    checked_in: apts.filter(a => ['checked_in','in_progress'].includes(a.status)).length,
    done:       apts.filter(a => a.status === 'done').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{todayLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/receptionist/checkin"
            className="flex items-center gap-2 bg-[#1a3a5c] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0f2540] transition-colors">
            Check-in bệnh nhân
          </Link>
          <Link to="/receptionist/appointments"
            className="flex items-center gap-2 border border-[#1a3a5c] text-[#1a3a5c] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors">
            Tạo phiếu khám
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Tổng lịch hẹn', value: counts.total,      color: 'text-gray-700' },
          { label: 'Chờ xác nhận',  value: counts.pending,    color: 'text-amber-600' },
          { label: 'Đã xác nhận',   value: counts.confirmed,  color: 'text-blue-600' },
          { label: 'Đang chờ khám', value: counts.checked_in, color: 'text-teal-600' },
          { label: 'Hoàn thành',    value: counts.done,       color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-base text-gray-900">Lịch hẹn hôm nay — {fmt(today)}</h2>
            <Link to="/receptionist/appointments" className="text-xs text-[#1a3a5c] font-semibold hover:underline">Xem tất cả →</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-sm">Không có lịch hẹn nào hôm nay</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {apts.map(apt => (
                <div key={apt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  {/* Time */}
                  <div className="w-12 text-center flex-shrink-0">
                    <div className="font-semibold text-sm text-[#1a3a5c]">{apt.time}</div>
                    {apt.queueNumber && (
                      <div className="text-[10px] text-gray-400 mt-0.5">#{apt.queueNumber}</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{apt.patientName}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {apt.doctor.user.name}
                      {apt.service && ` · ${apt.service.name}`}
                    </div>
                  </div>
                  {/* Status + action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_CFG[apt.status]?.cls}`}>
                      {STATUS_CFG[apt.status]?.label}
                    </span>
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(apt.id)}
                        disabled={confirming === apt.id}
                        className="text-xs px-3 py-1.5 bg-[#1a3a5c] text-white rounded-lg font-semibold hover:bg-[#0f2540] transition-colors disabled:opacity-60"
                      >
                        {confirming === apt.id ? '...' : 'Xác nhận'}
                      </button>
                    )}
                    {apt.status === 'confirmed' && !apt.invoice && (
                      <Link to="/receptionist/checkin"
                        className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors">
                        Check-in
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue today */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900">Doanh thu hôm nay</h2>
              <Link to="/receptionist/invoices" className="text-xs text-[#1a3a5c] font-semibold hover:underline">Chi tiết →</Link>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {totalRevenue.toLocaleString('vi-VN')}đ
            </div>
            <div className="space-y-2">
              {Object.entries(byMethod).length === 0 ? (
                <p className="text-sm text-gray-400">Chưa có hóa đơn hôm nay</p>
              ) : Object.entries(byMethod).map(([m, v]) => (
                <div key={m} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{methodLabel[m] ?? m}</span>
                  <span className="font-semibold">{v.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{invoices.length} hóa đơn</span>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-[#1a3a5c] rounded-xl p-5 text-white">
            <div className="text-sm font-medium opacity-80 mb-3">Tiến độ hôm nay</div>
            <div className="space-y-2">
              {[
                { label: 'Đã xử lý', val: counts.done + counts.checked_in, total: counts.total },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className="font-bold">{s.val}/{s.total}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${s.total ? (s.val/s.total)*100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
