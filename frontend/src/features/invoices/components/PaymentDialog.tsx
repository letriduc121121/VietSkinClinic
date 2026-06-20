import { useEffect, useState } from 'react';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import { invoiceApi } from '../api/invoice.api';
import { fmtVnd } from '@/shared/lib/format';
import { CLINIC_BANK, buildVietQR, type PayMethod } from '../lib/payment';

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c]/40';

interface AptDetail {
  id: number;
  patientName: string;
  patientPhone: string | null;
  doctor: { user: { name: string }; consultationFee: string };
  service: { name: string; price: string } | null;
  invoice?: { status: string; amount: string } | null;
  prescription: {
    items: { medicineName: string; dosage: string; frequency: string; duration: string; quantity: number }[];
  } | null;
}

export function PaymentDialog({ apt, onClose, onSuccess }: { apt: Appointment; onClose: () => void; onSuccess: () => void }) {
  const [detail, setDetail] = useState<AptDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    appointmentApi.getById(apt.id)
      .then(data => setDetail(data as any))
      .catch(() => {
        setDetail({
          id: apt.id,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone ?? null,
          doctor: apt.doctor as any,
          service: apt.service as any,
          invoice: apt.invoice ?? null,
          prescription: null,
        });
      })
      .finally(() => setFetching(false));
  }, [apt.id]);

  const consultationFee = detail ? Number(detail.doctor.consultationFee) || 150000 : 0;
  const servicePrice = detail?.service ? Number(detail.service.price) : 0;
  // Ưu tiên số tiền đã chốt trên hóa đơn (unpaid) khi khám xong; fallback về cách tính nếu chưa có
  const invoiceAmount = detail?.invoice?.amount != null ? Number(detail.invoice.amount) : null;
  const amount = invoiceAmount != null && !Number.isNaN(invoiceAmount) ? invoiceAmount : consultationFee + servicePrice;
  const presItems = detail?.prescription?.items ?? [];

  const cashNum = Number(cashInput.replace(/\D/g, '')) || 0;
  const change = cashNum - amount;
  const addInfo = `VIETSKIN LH${apt.id}`;

  const handleSubmit = async () => {
    if (method === 'cash' && cashNum < amount) {
      setError('Số tiền nhận phải >= số tiền cần thanh toán');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await invoiceApi.create({ appointmentId: apt.id, paymentMethod: method, note: note || undefined } as any);
      setPaid(true);
      setTimeout(() => { onSuccess(); }, 1400);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const TABS: { key: PayMethod; label: string; icon: string }[] = [
    { key: 'cash', label: 'Tiền mặt', icon: '💵' },
    { key: 'bank_transfer', label: 'Chuyển khoản', icon: '🏦' },
    { key: 'qr_code', label: 'QR Code', icon: '📱' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold">Thu tiền khám</h3>
            <p className="text-xs text-gray-400 mt-0.5">{apt.patientName} · Lịch #{apt.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {paid ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">Thanh toán thành công!</p>
                <p className="text-2xl font-bold text-[#1a3a5c] mt-1">{fmtVnd(amount)}</p>
                <p className="text-sm text-gray-400 mt-1">{detail?.doctor.user.name}</p>
              </div>
            </div>
          ) : fetching ? (
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Đang tải thông tin...</p>
            </div>
          ) : (
            <>
              <div className="px-6 pt-5 pb-4 bg-gray-50 border-b border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chi tiết thanh toán</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a5c] flex-shrink-0" />
                    <span className="text-gray-700">Phí khám</span>
                    <span className="text-xs text-gray-400">{detail?.doctor.user.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{fmtVnd(consultationFee)}</span>
                </div>
                {detail?.service && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="text-gray-700">Dịch vụ</span>
                      <span className="text-xs text-gray-400">{detail.service.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{fmtVnd(servicePrice)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-[#1a3a5c]">{fmtVnd(amount)}</span>
                </div>
                {presItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn thuốc kê</p>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-bold">Thu tiền thuốc riêng</span>
                    </div>
                    <div className="space-y-1.5">
                      {presItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">{item.medicineName}</span>
                          <span className="text-gray-400">
                            {[item.dosage, item.frequency, `${item.duration}`].filter(Boolean).join(' · ')} · SL: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phương thức thanh toán</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TABS.map(t => (
                      <button
                        key={t.key}
                        onClick={() => { setMethod(t.key); setError(''); }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          method === t.key ? 'border-[#1a3a5c] bg-blue-50 text-[#1a3a5c]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {method === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Tiền khách đưa</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cashInput}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCashInput(raw ? Number(raw).toLocaleString('vi-VN') : '');
                        }}
                        placeholder="Nhập số tiền..."
                        className={inputCls}
                        autoFocus
                      />
                    </div>
                    {cashNum > 0 && (
                      <div className={`rounded-xl p-3 flex items-center justify-between font-bold ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        <span className="text-sm">{change >= 0 ? 'Tiền thừa trả lại' : 'Còn thiếu'}</span>
                        <span className="text-lg">{fmtVnd(Math.abs(change))}</span>
                      </div>
                    )}
                  </div>
                )}

                {method === 'bank_transfer' && (
                  <div className="bg-blue-50 rounded-2xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Thông tin tài khoản</p>
                    {[
                      { label: 'Ngân hàng', value: CLINIC_BANK.bankCode },
                      { label: 'Số tài khoản', value: CLINIC_BANK.accountNo },
                      { label: 'Chủ tài khoản', value: CLINIC_BANK.accountName },
                      { label: 'Số tiền', value: fmtVnd(amount) },
                      { label: 'Nội dung CK', value: addInfo },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-blue-500 flex-shrink-0">{r.label}</span>
                        <span className="text-sm font-bold text-blue-900 text-right break-all">{r.value}</span>
                      </div>
                    ))}
                    <p className="text-xs text-blue-500 pt-2 border-t border-blue-200">Bấm xác nhận sau khi đã nhận được tiền trong tài khoản.</p>
                  </div>
                )}

                {method === 'qr_code' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider self-start">Quét mã QR để thanh toán</p>
                    <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 shadow-sm">
                      <img src={buildVietQR(amount, addInfo)} alt="VietQR" className="w-52 h-52 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div className="w-full bg-indigo-50 rounded-xl p-3 space-y-1.5">
                      {[
                        { label: 'Ngân hàng', value: CLINIC_BANK.bankCode },
                        { label: 'Số tiền', value: fmtVnd(amount) },
                        { label: 'Nội dung', value: addInfo },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-xs">
                          <span className="text-indigo-500">{r.label}</span>
                          <span className="font-bold text-indigo-800">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center">Hỗ trợ tất cả ứng dụng ngân hàng Việt Nam (VietQR)</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Ghi chú (tuỳ chọn)</label>
                  <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú hoá đơn..." className={inputCls} />
                </div>

                {error && <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>}
              </div>
            </>
          )}
        </div>

        {!paid && !fetching && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Huỷ</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (method === 'cash' && cashNum < amount)}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-green-500/20"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Đang xử lý...' : method === 'cash' ? 'Xác nhận thu tiền' : 'Đã nhận thanh toán'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
