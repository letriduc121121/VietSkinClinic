import { fmtDate, fmtVnd } from '@/shared/lib/format';
import { printInvoice } from '../utils/printInvoice';
import { METHOD_CFG } from '../lib/method';
import type { Invoice } from '../types/invoice.types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export function InvoiceDetailDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const isPaid = invoice.status === 'paid';
  const method = METHOD_CFG[invoice.method];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-base">Chi tiết hoá đơn</h2>
            <p className="text-xs text-gray-400 mt-0.5">{invoice.invoiceCode}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thông tin khám</p>
            {invoice.appointment && (
              <>
                <Row label="Ngày khám" value={fmtDate(invoice.appointment.date)} />
                <Row label="Giờ khám" value={invoice.appointment.time} />
                {invoice.appointment.doctor && <Row label="Bác sĩ" value={invoice.appointment.doctor.user.name} />}
                {invoice.appointment.service && <Row label="Dịch vụ" value={invoice.appointment.service.name} />}
              </>
            )}
            <Row label="Mô tả" value={invoice.description} />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thanh toán</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Phương thức</span>
              {isPaid ? (
                method
                  ? <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${method.cls}`}>{method.icon} {method.label}</span>
                  : <span className="text-sm font-semibold">{invoice.method}</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-orange-100 text-orange-700">Chưa thanh toán</span>
              )}
            </div>
            {isPaid && <Row label="Thời gian" value={new Date(invoice.paidAt || invoice.createdAt).toLocaleString('vi-VN')} />}
            {invoice.receiver && <Row label="Thu ngân" value={invoice.receiver.name} />}
            {invoice.note && <Row label="Ghi chú" value={invoice.note} />}
          </div>

          <div className={`flex items-center justify-between rounded-xl px-4 py-4 ${isPaid ? 'bg-green-50' : 'bg-orange-50'}`}>
            <span className="font-bold text-sm">{isPaid ? 'Tổng đã thanh toán' : 'Tổng cần thanh toán'}</span>
            <span className={`text-2xl font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>{fmtVnd(invoice.amount)}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => printInvoice(invoice)} className="flex-1 py-2.5 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In hoá đơn
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
