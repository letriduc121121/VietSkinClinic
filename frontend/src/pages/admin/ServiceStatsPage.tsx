import { fmtVnd, fmtShort } from '@/shared/lib/format';
import { useServiceStats } from '@/features/stats/hooks/useStats';
import { StatCard } from '@/features/stats/components/StatCard';

export default function ServiceStatsPage() {
  const { data, loading } = useServiceStats();

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải dữ liệu thống kê...</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-red-400">Không thể tải dữ liệu.</div>;

  const maxRevenue = Math.max(...data.services.map(s => s.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Thống kê dịch vụ</h1>
        <p className="text-sm text-gray-500 mt-1">Lượt sử dụng và doanh thu theo từng dịch vụ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="💉" label="Dịch vụ đang hoạt động" value={data.totalServices.toLocaleString('vi-VN')} color="indigo" />
        <StatCard icon="✅" label="Tổng lượt sử dụng" value={data.totalServiceVisits.toLocaleString('vi-VN')} color="blue" />
        <StatCard icon="💰" label="Doanh thu từ dịch vụ" value={fmtVnd(data.totalServiceRevenue)} color="green" />
      </div>

      {data.services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">Chưa có dữ liệu dịch vụ.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Doanh thu theo dịch vụ</h2>
            <div className="space-y-3">
              {data.services.map(s => (
                <div key={s.serviceName}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-gray-700">{s.serviceName}</span>
                    <span className="font-semibold text-green-600">{fmtShort(s.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${Math.max((s.revenue / maxRevenue) * 100, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700">Chi tiết theo dịch vụ</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Dịch vụ</th>
                    <th className="px-4 py-3 text-right">Lượt</th>
                    <th className="px-4 py-3 text-right">Doanh thu</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">TB/lượt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.services.map((s, i) => (
                    <tr key={s.serviceName} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{s.serviceName}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{s.count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{fmtVnd(s.revenue)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">{s.count > 0 ? fmtVnd(Math.round(s.revenue / s.count)) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
