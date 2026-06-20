import { useState } from 'react';
import { fmtVnd } from '@/shared/lib/format';
import { useUnpaidPayments } from '@/features/invoices/hooks/useUnpaidPayments';
import { PaymentDialog } from '@/features/invoices/components/PaymentDialog';
import type { Appointment } from '@/features/appointments/types/appointment.types';

const aptTotal = (a: Appointment) => (Number(a.doctor?.consultationFee) || 150000) + (Number(a.service?.price) || 0);

export default function CollectPaymentPage() {
  const { apts, loading, date, setDate, reload } = useUnpaidPayments();
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [payingApt, setPayingApt] = useState<Appointment | null>(null);

  const handleSearch = () => setSearchQuery(search);

  const displayed = apts.filter(a =>
    !searchQuery || a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.patientPhone?.includes(searchQuery),
  );
  const totalAmount = displayed.reduce((sum, a) => sum + aptTotal(a), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thu tiền bệnh nhân</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách bệnh nhân đã khám xong và chưa thanh toán</p>
        </div>
        {displayed.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 text-right">
            <div className="text-xs text-orange-500 font-medium">Tổng cần thu</div>
            <div className="text-xl font-bold text-orange-600">{fmtVnd(totalAmount)}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Tên bệnh nhân, SĐT..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10" />
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none" />
          <button onClick={reload} title="Làm mới" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={handleSearch} className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:bg-[#15304e] transition-all">
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
          <div className="col-span-2">Dịch vụ</div>
          <div className="col-span-1 text-right">Số tiền</div>
          <div className="col-span-1 text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-bold text-gray-700">Không có bệnh nhân chờ thu tiền</h3>
            <p className="text-sm text-gray-400 mt-1">{search ? 'Thử tìm kiếm với từ khoá khác.' : 'Tất cả đã thanh toán hoặc chưa khám xong.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map(apt => (
              <div key={apt.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-orange-50/40 transition-colors">
                <div className="col-span-1"><div className="font-bold text-sm text-[#1a3a5c]">{apt.time}</div></div>
                <div className="col-span-3 pr-2">
                  <div className="font-semibold text-sm">{apt.patientName}</div>
                  {apt.symptoms && <div className="text-xs text-gray-400 truncate">{apt.symptoms}</div>}
                </div>
                <div className="col-span-2 text-sm text-gray-500">{apt.patientPhone}</div>
                <div className="col-span-2 text-sm text-gray-500 truncate">{apt.doctor?.user?.name}</div>
                <div className="col-span-2 text-sm text-gray-500 truncate">{apt.service?.name ?? <span className="text-gray-300">—</span>}</div>
                <div className="col-span-1 text-right"><span className="font-bold text-sm text-orange-600">{fmtVnd(aptTotal(apt))}</span></div>
                <div className="col-span-1 text-right">
                  <button onClick={() => setPayingApt(apt)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm">Thu tiền</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayed.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-orange-50 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">{displayed.length} bệnh nhân chờ thu tiền</span>
            <span className="font-bold text-orange-600">{fmtVnd(totalAmount)}</span>
          </div>
        )}
      </div>

      {payingApt && (
        <PaymentDialog apt={payingApt} onClose={() => setPayingApt(null)} onSuccess={() => { setPayingApt(null); reload(); }} />
      )}
    </div>
  );
}
