import { usePatientStats } from '@/features/stats/hooks/useStats';
import { StatCard } from '@/features/stats/components/StatCard';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', checked_in: 'Đã check-in',
  in_progress: 'Đang khám', done: 'Hoàn thành', cancelled: 'Đã huỷ', no_show: 'Không đến',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-cyan-100 text-cyan-700', in_progress: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-500', no_show: 'bg-red-100 text-red-700',
};

export default function PatientStatsPage() {
  const { data, loading } = usePatientStats();

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải dữ liệu thống kê...</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-red-400">Không thể tải dữ liệu.</div>;

  const maxVisit = Math.max(...data.visitsByMonth.map(v => v.count), 1);
  const maxDoc = Math.max(...data.topDoctors.map(d => d.count), 1);
  const totalStatus = Object.values(data.appointmentStatusDist).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Thống kê bệnh nhân</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan dữ liệu hoạt động khám bệnh</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👤" label="Tổng bệnh nhân" value={data.totalPatients.toLocaleString()} color="blue" />
        <StatCard icon="🆕" label="Mới tháng này" value={`+${data.newThisMonth}`} color="green" />
        <StatCard icon="✅" label="Tổng lượt khám" value={data.totalVisits.toLocaleString()} color="purple" />
        <StatCard icon="⚠️" label="Tỷ lệ không đến" value={`${data.noShowRate}%`} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Lượt khám theo tháng (6 tháng gần nhất)</h2>
        <div className="flex items-end gap-3 h-40">
          {data.visitsByMonth.map(mv => (
            <div key={mv.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-600">{mv.count}</span>
              <div className="w-full bg-blue-500 rounded-t-md transition-all" style={{ height: `${(mv.count / maxVisit) * 100}%`, minHeight: mv.count > 0 ? '4px' : '2px' }} />
              <span className="text-xs text-gray-400 whitespace-nowrap">{mv.month.slice(5)}/{mv.month.slice(0, 4)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top 5 bác sĩ theo số ca khám</h2>
          {data.topDoctors.length === 0 ? <p className="text-sm text-gray-400">Chưa có dữ liệu</p> : (
            <div className="space-y-3">
              {data.topDoctors.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{d.doctorName}</span>
                      <span className="text-gray-500">{d.count} ca</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(d.count / maxDoc) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Phân bổ trạng thái lịch hẹn</h2>
          <div className="space-y-2">
            {Object.entries(data.appointmentStatusDist).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-32 text-center ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[status] ?? status}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-slate-500 h-2 rounded-full" style={{ width: `${(count / totalStatus) * 100}%` }} />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Top 10 chẩn đoán phổ biến</h2>
        {data.topDiagnoses.length === 0 ? <p className="text-sm text-gray-400">Chưa có lịch sử khám nào có chẩn đoán.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 font-medium">Chẩn đoán</th>
                  <th className="pb-2 text-right font-medium">Số lần</th>
                </tr>
              </thead>
              <tbody>
                {data.topDiagnoses.map((d, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-2 text-gray-700">{d.diagnosis}</td>
                    <td className="py-2 text-right font-medium text-indigo-600">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
