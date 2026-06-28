import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Banknote, Wallet, Users, Calendar, UserRoundCog, User, Activity, Pill, BarChart3 } from 'lucide-react';
import { fmtVnd, fmtShort } from '@/shared/lib/format';
import { useAdminDashboard } from '@/features/dashboard/hooks/useAdminDashboard';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700'   },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700'     },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700'     },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700'   },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600'       },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-600'     },
};

const monthLabel = (ym: string) => 'T' + Number(ym.slice(5, 7));

export default function AdminDashboard() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const { appointments, patientStats, revenueStats, loading } = useAdminDashboard();

  const maxRevenue = Math.max(...(revenueStats?.monthly.map(m => m.revenue) ?? [1]), 1);
  const totalStatus = patientStats ? Object.values(patientStats.appointmentStatusDist).reduce((s, v) => s + v, 0) || 1 : 1;

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const doneCount = appointments.filter(a => a.status === 'done').length;
  const todayRevenue = revenueStats?.todayTotal ?? 0;
  const monthRevenue = revenueStats?.monthTotal ?? 0;
  const totalPatients = patientStats?.totalPatients ?? 0;

  const summaryCards = [
    { label: 'Doanh thu tháng này', value: fmtVnd(monthRevenue), color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100', icon: <Banknote className="w-6 h-6" /> },
    { label: 'Doanh thu hôm nay', value: fmtVnd(todayRevenue), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', icon: <Wallet className="w-6 h-6" /> },
    { label: 'Tổng số bệnh nhân', value: totalPatients.toLocaleString('vi-VN'), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', icon: <Users className="w-6 h-6" /> },
    { label: 'Lịch hẹn hôm nay', value: appointments.length.toString(), color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', icon: <Calendar className="w-6 h-6" /> },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan thống kê</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">Xin chào, {user?.name} · {today}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map(s => (
              <div key={s.label} className={`rounded-2xl p-5 border ${s.bg}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
                </div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Col: Revenue Chart & Appointments */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-base mb-6 text-gray-900">Biểu đồ doanh thu 6 tháng gần nhất</h2>
                <div className="flex items-end gap-3 h-48">
                  {revenueStats?.monthly.map(m => {
                    const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                    const isCurrentMonth = m.month === new Date().toISOString().slice(0, 7);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {fmtShort(m.revenue)}
                        </div>
                        <div className="w-full flex items-end" style={{ height: '140px' }}>
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${isCurrentMonth ? 'bg-indigo-600' : 'bg-indigo-200 group-hover:bg-indigo-400'}`}
                            style={{ height: pct > 0 ? `${Math.max(pct, 4)}%` : '4px' }}
                            title={fmtVnd(m.revenue)}
                          />
                        </div>
                        <div className={`text-xs font-semibold ${isCurrentMonth ? 'text-indigo-700' : 'text-gray-400'}`}>
                          {monthLabel(m.month)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h2 className="font-bold text-base text-gray-900">Lịch hẹn hôm nay</h2>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">{pendingCount} chờ</span>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-bold">{doneCount} xong</span>
                  </div>
                </div>
                {appointments.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 text-sm">Không có lịch hẹn hôm nay</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="px-6 py-3 text-left">Giờ</th>
                          <th className="px-4 py-3 text-left">Bệnh nhân</th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">Bác sĩ</th>
                          <th className="px-4 py-3 text-left">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {appointments.slice(0, 6).map(a => (
                          <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-semibold text-gray-700">{a.time}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{a.patientName}</div>
                              {a.service && <div className="text-[11px] text-gray-500 mt-0.5">{a.service.name}</div>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{a.doctor?.user?.name || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${STATUS[a.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                                {STATUS[a.status]?.label ?? a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {appointments.length > 6 && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-white text-center text-[13px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors">
                    <Link to="/admin/schedule">Xem tất cả lịch hẹn hôm nay →</Link>
                  </div>
                )}
              </div>

            </div>

            {/* Right Col: Patient Stats & Quick Links */}
            <div className="space-y-6">
              
              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h2 className="font-bold text-base text-gray-900 mb-4">Quản lý nhanh</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
    { label: 'Nhân sự', icon: <UserRoundCog className="w-6 h-6 mb-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />, to: '/admin/staff' },
    { label: 'Bệnh nhân', icon: <User className="w-6 h-6 mb-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />, to: '/admin/patients' },
    { label: 'Dịch vụ & Giá', icon: <Activity className="w-6 h-6 mb-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />, to: '/admin/services' },
    { label: 'Danh mục thuốc', icon: <Pill className="w-6 h-6 mb-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />, to: '/admin/medicines' },
    { label: 'Lịch khám', icon: <Calendar className="w-6 h-6 mb-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />, to: '/admin/schedule' },
    { label: 'Thống kê', icon: <BarChart3 className="w-6 h-6 mb-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />, to: '/admin/stats' },
  ].map(a => (
                    <Link
                      key={a.label}
                      to={a.to}
                      className="group flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-gray-100 hover:border-indigo-200"
                    >
                      {a.icon}
                      <span className="text-[11px] font-semibold text-gray-600 group-hover:text-indigo-700">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Status Distribution */}
              {patientStats && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="font-bold text-base text-gray-900 mb-4">Trạng thái lịch hẹn</h2>
                  <div className="space-y-3">
                    {Object.entries(patientStats.appointmentStatusDist).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                      if (count === 0) return null;
                      const s = STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                              {s.label}
                            </span>
                            <span className="font-bold text-gray-700">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-indigo-500 h-1.5 rounded-full"
                              style={{ width: `${(count / totalStatus) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Doctors */}
              {patientStats && patientStats.topDoctors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h2 className="font-bold text-base text-gray-900 mb-4">Bác sĩ khám nhiều nhất</h2>
                  <div className="space-y-4">
                    {patientStats.topDoctors.slice(0, 4).map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-100">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{d.doctorName}</p>
                          <p className="text-[11px] text-gray-500">{d.count} ca khám</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
