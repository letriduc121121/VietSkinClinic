import { useState } from 'react';
import { fmtVnd, fmtShort } from '@/shared/lib/format';
import { useInvoiceStats, useInvoices } from '@/features/invoices/hooks/useInvoices';
import { METHOD_CFG } from '@/features/invoices/lib/method';
import { exportApi } from '@/features/export/api/export.api';

const monthLabel = (ym: string) => 'T' + Number(ym.slice(5, 7));

export default function RevenueStatsPage() {
  const { stats, loading: sLoading } = useInvoiceStats();
  const { invoices: allInvoices, loading: iLoading } = useInvoices();
  const loading = sLoading || iLoading;
  const invoices = allInvoices.slice(0, 10);

  const [exporting, setExporting] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  const maxRevenue = Math.max(...(stats?.monthly.map(m => m.revenue) ?? [1]), 1);
  const summaryCards = [
    { label: 'Hôm nay', value: stats?.todayTotal ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: '📅' },
    { label: 'Tháng này', value: stats?.monthTotal ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '📆' },
    { label: 'Tổng doanh thu', value: stats?.grandTotal ?? 0, color: 'text-[#1a3a5c]', bg: 'bg-slate-50', icon: '💰' },
  ];

  const handleExportPdf = async () => {
    setExporting(true);
    try { await exportApi.downloadRevenuePdf(filterYear, filterMonth); }
    finally { setExporting(false); }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [new Date().getFullYear() - 1, new Date().getFullYear()];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Thống kê doanh thu</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan doanh thu phòng khám</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleExportPdf} disabled={exporting} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            {exporting ? '⏳' : '📄'} PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {summaryCards.map(c => (
              <div key={c.label} className={`rounded-2xl border border-gray-100 shadow-sm p-5 ${c.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{c.label}</span>
                </div>
                <div className={`text-2xl font-bold ${c.color}`}>{fmtVnd(c.value)}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-base mb-6">Doanh thu 6 tháng gần nhất</h2>
              <div className="flex items-end gap-3 h-48">
                {stats?.monthly.map(m => {
                  const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                  const isCurrentMonth = m.month === new Date().toISOString().slice(0, 7);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{fmtShort(m.revenue)}</div>
                      <div className="w-full flex items-end" style={{ height: '140px' }}>
                        <div className={`w-full rounded-t-lg transition-all duration-500 ${isCurrentMonth ? 'bg-[#1a3a5c]' : 'bg-[#1a3a5c]/30 group-hover:bg-[#1a3a5c]/60'}`} style={{ height: pct > 0 ? `${Math.max(pct, 4)}%` : '4px' }} title={fmtVnd(m.revenue)} />
                      </div>
                      <div className={`text-xs font-semibold ${isCurrentMonth ? 'text-[#1a3a5c]' : 'text-gray-400'}`}>{monthLabel(m.month)}</div>
                    </div>
                  );
                })}
              </div>
              {maxRevenue === 1 && <p className="text-xs text-gray-400 text-center mt-4">Chưa có dữ liệu doanh thu</p>}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-base mb-5">Theo phương thức</h2>
              <div className="space-y-4">
                {Object.entries(stats?.byMethod ?? {}).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu</p>
                ) : (
                  Object.entries(stats?.byMethod ?? {}).sort(([, a], [, b]) => b - a).map(([method, total]) => {
                    const cfg = METHOD_CFG[method] ?? { label: method, cls: 'bg-gray-100 text-gray-600', icon: '💰' };
                    const pct = stats!.grandTotal > 0 ? (total / stats!.grandTotal) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                          <span className="text-xs font-bold text-gray-600">{fmtVnd(total)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#1a3a5c] transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-right text-[10px] text-gray-400 mt-0.5">{pct.toFixed(1)}%</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base">Hoá đơn gần đây</h2>
              <span className="text-xs text-gray-400">{invoices.length} hoá đơn mới nhất</span>
            </div>
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Chưa có hoá đơn nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Mã HĐ</th>
                      <th className="px-4 py-3 text-left">Bệnh nhân</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Ngày</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Phương thức</th>
                      <th className="px-4 py-3 text-right">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map(inv => {
                      const m = METHOD_CFG[inv.method];
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-gray-500">{inv.invoiceCode}</td>
                          <td className="px-4 py-3 font-medium">{inv.patientName}</td>
                          <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                            {inv.appointment ? new Date(inv.appointment.date).toLocaleDateString('vi-VN') : new Date(inv.paidAt || inv.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {m ? <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${m.cls}`}>{m.icon} {m.label}</span> : inv.method}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">{fmtVnd(inv.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
