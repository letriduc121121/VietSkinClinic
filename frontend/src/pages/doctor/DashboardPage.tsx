import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDoctorDashboard } from '@/features/dashboard/hooks/useDoctorDashboard';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700'   },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700'     },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700'     },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700'   },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600'       },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-500'     },
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const { appointments, loading } = useDoctorDashboard();

  const waiting     = appointments.filter(a => a.status === 'checked_in');
  const inProgress  = appointments.filter(a => a.status === 'in_progress');
  const done        = appointments.filter(a => a.status === 'done');
  const nextPatient = inProgress[0] ?? waiting[0] ?? null;

  const stats = [
    { label: 'Tổng lịch hôm nay', value: loading ? '–' : String(appointments.length), color: 'text-[#1a3a5c]', bg: 'bg-blue-50'   },
    { label: 'Đang chờ khám',     value: loading ? '–' : String(waiting.length),       color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: 'Đang khám',         value: loading ? '–' : String(inProgress.length),    color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Đã hoàn thành',     value: loading ? '–' : String(done.length),          color: 'text-green-600',  bg: 'bg-green-50'  },
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
          to="/doctor/today"
          className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0f2540] transition-colors"
        >
          Lịch hôm nay
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current patient */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-base text-gray-900">Bệnh nhân hiện tại</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="h-28 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>
              ) : nextPatient ? (
                <div className="bg-[#1a3a5c] rounded-xl p-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS[nextPatient.status]?.cls}`}>
                        {STATUS[nextPatient.status]?.label}
                      </span>
                      <div className="text-xl font-bold">{nextPatient.patientName}</div>
                      <div className="text-blue-200 text-sm">
                        {nextPatient.queueNumber && `STT #${nextPatient.queueNumber} · `}{nextPatient.time}
                      </div>
                      {nextPatient.symptoms && (
                        <div className="text-blue-100 text-sm">{nextPatient.symptoms}</div>
                      )}
                      {nextPatient.service && (
                        <div className="text-blue-200 text-sm">{nextPatient.service.name}</div>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <Link
                        to="/doctor/today"
                        className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-sm font-semibold transition-colors text-center"
                      >
                        Xem lịch
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-gray-500 text-sm">Không có bệnh nhân đang khám</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {waiting.length > 0 ? `${waiting.length} bệnh nhân đang chờ` : 'Chưa có bệnh nhân hôm nay'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Today list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base text-gray-900">Lịch hôm nay</h2>
              <Link to="/doctor/today" className="text-xs text-[#1a3a5c] font-semibold hover:underline">
                Xem đầy đủ →
              </Link>
            </div>
            {loading ? (
              <div className="h-20 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>
            ) : appointments.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Không có lịch hẹn hôm nay</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {appointments.slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-12 text-sm font-semibold text-gray-500 flex-shrink-0">{a.time}</div>
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0">
                      {a.queueNumber ?? '–'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{a.patientName}</div>
                      {a.symptoms && <div className="text-xs text-gray-400 truncate">{a.symptoms}</div>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS[a.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS[a.status]?.label ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-base text-gray-900 mb-4">Truy cập nhanh</h2>
            <div className="space-y-1">
              <Link
                to="/doctor/today"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Lịch khám hôm nay</span>
              </Link>
            </div>
          </div>

          {/* Workflow guide */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-sm text-gray-700 mb-3">Quy trình khám</h3>
            <ol className="space-y-2.5">
              {[
                'Lễ tân check-in + thu phí',
                'Gọi vào → trạng thái "Đang khám"',
                'Ghi bệnh án, chẩn đoán, điều trị',
                'Kê đơn / chỉ định XN (nếu cần)',
                'Hoàn tất → trạng thái "Xong"',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
