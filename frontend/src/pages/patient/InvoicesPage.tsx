import { useState } from 'react';
import { fmtDate, fmtVnd } from '@/shared/lib/format';
import { useMyInvoices } from '@/features/invoices/hooks/useInvoices';
import { METHOD_CFG } from '@/features/invoices/lib/method';
import { InvoiceDetailDialog } from '@/features/invoices/components/InvoiceDetailDialog';
import type { Invoice } from '@/features/invoices/types/invoice.types';

export default function PatientInvoicesPage() {
  const { invoices, loading } = useMyInvoices();
  const [selected, setSelected] = useState<Invoice | null>(null);

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lịch sử thanh toán</h1>
        <p className="text-sm text-gray-500 mt-1">Tất cả hoá đơn khám của bạn</p>
      </div>

      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tổng lần khám</p>
            <p className="text-3xl font-bold text-[#1a3a5c] mt-1">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tổng đã thanh toán</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{fmtVnd(totalPaid)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold">Danh sách hoá đơn</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-sm font-medium">Bạn chưa có hoá đơn nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map(inv => {
              const isPaid = inv.status === 'paid';
              const method = METHOD_CFG[inv.method] ?? { label: inv.method, cls: 'bg-gray-100 text-gray-600', icon: '💰' };
              return (
                <div key={inv.id} onClick={() => setSelected(inv)} className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">{inv.invoiceCode}</span>
                      {isPaid ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${method.cls}`}>{method.icon} {method.label}</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700">⏳ Chưa thanh toán</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{inv.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.appointment ? `${fmtDate(inv.appointment.date)} · ${inv.appointment.time}` : fmtDate(inv.paidAt || inv.createdAt)}
                      {inv.appointment?.doctor && ` · ${inv.appointment.doctor.user.name}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-base font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>{fmtVnd(inv.amount)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <InvoiceDetailDialog invoice={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
