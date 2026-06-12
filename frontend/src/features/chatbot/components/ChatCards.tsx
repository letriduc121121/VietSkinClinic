import {
  Stethoscope,
  Clock,
  Banknote,
  CalendarCheck,
  CalendarClock,
  MapPin,
  Phone,
  CreditCard,
  Receipt,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { CardEvent } from '@/features/chatbot/api/chatbot.api';

/** Định dạng tiền VND: 500000 → "500.000đ". */
function vnd(value: unknown): string {
  const n = Number(value);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('vi-VN') + 'đ';
}

// Nhãn + màu cho trạng thái lịch hẹn (khớp enum AppointmentStatus ở backend)
const APPT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'Đã check-in', cls: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: 'Đang khám', cls: 'bg-purple-100 text-purple-700' },
  done: { label: 'Đã khám xong', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-600' },
  no_show: { label: 'Không đến', cls: 'bg-gray-100 text-gray-500' },
};

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  unpaid: { label: 'Chưa thanh toán', cls: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Đã thanh toán', cls: 'bg-green-100 text-green-700' },
  refunded: { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-500' },
};

const PAY_METHOD: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  qr_code: 'Mã QR',
  card: 'Quẹt thẻ',
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-400">
      {text}
    </div>
  );
}

/** Khối card chung — viền nhẹ, bo góc, nền trắng. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">{children}</div>
  );
}

// ── Từng loại card ──────────────────────────────────────────────────────────

function ServicesCard({ data }: { data: any }) {
  const items: any[] = data?.dich_vu ?? [];
  if (!items.length) return <EmptyHint text="Chưa có dịch vụ phù hợp." />;
  return (
    <div className="space-y-2">
      {items.map((s, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#1a3a5c]">{s.ten_dich_vu}</p>
            <span className="whitespace-nowrap text-sm font-bold text-[#6EC1B4]">{vnd(s.gia_vnd)}</span>
          </div>
          {s.mo_ta && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{s.mo_ta}</p>}
          {s.thoi_gian_phut != null && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="h-3 w-3" /> {s.thoi_gian_phut} phút
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function DoctorsCard({ data }: { data: any }) {
  const items: any[] = data?.bac_si ?? [];
  if (!items.length) return <EmptyHint text="Không tìm thấy bác sĩ phù hợp." />;
  return (
    <div className="space-y-2">
      {items.map((d, i) => (
        <Card key={i}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#6EC1B4]/15 text-[#1a3a5c]">
              <Stethoscope className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1a3a5c]">{d.ten_bac_si}</p>
              <p className="truncate text-[11px] text-gray-500">
                {[d.hoc_vi, d.chuyen_khoa, d.kinh_nghiem].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          {d.phi_kham_vnd != null && (
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-600">
              <Banknote className="h-3.5 w-3.5 text-[#6EC1B4]" /> Phí khám:
              <span className="font-semibold text-[#1a3a5c]">{vnd(d.phi_kham_vnd)}</span>
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function AvailabilityCard({ data }: { data: any }) {
  const slots: any[] = data?.slots ?? [];
  const free = slots.filter((s) => s.trong);
  return (
    <Card>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[#6EC1B4]" />
        <p className="text-sm font-semibold text-[#1a3a5c]">{data?.ten_bac_si || 'Bác sĩ'}</p>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">
        Ngày {data?.ngay}
        {data?.phong ? ` · Phòng ${data.phong}` : ''}
      </p>
      {!data?.co_lich_lam ? (
        <p className="mt-2 text-xs text-gray-400">Bác sĩ không có lịch làm việc ngày này.</p>
      ) : free.length === 0 ? (
        <p className="mt-2 text-xs text-amber-600">Đã kín lịch — vui lòng chọn ngày khác.</p>
      ) : (
        <>
          <p className="mt-2 mb-1.5 text-[11px] text-gray-500">
            Còn <b className="text-[#1a3a5c]">{free.length}</b> khung giờ trống:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {free.map((s, i) => (
              <span
                key={i}
                className="rounded-lg border border-[#6EC1B4]/40 bg-[#6EC1B4]/10 px-2 py-1 text-[11px] font-medium text-[#1a3a5c]"
              >
                {s.gio}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function ClinicCard({ data }: { data: any }) {
  const rows = [
    { icon: Clock, label: 'Giờ làm việc', value: data?.gio_lam_viec },
    { icon: MapPin, label: 'Địa chỉ', value: data?.dia_chi },
    { icon: Phone, label: 'Hotline', value: data?.hotline },
    { icon: Stethoscope, label: 'Chuyên khoa', value: data?.chuyen_khoa },
  ].filter((r) => r.value);
  return (
    <Card>
      <p className="mb-2 text-sm font-semibold text-[#1a3a5c]">{data?.ten || 'Phòng khám VietSkin'}</p>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
            <r.icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#6EC1B4]" />
            <span>
              <span className="text-gray-400">{r.label}: </span>
              {r.value}
            </span>
          </div>
        ))}
        {Array.isArray(data?.thanh_toan) && data.thanh_toan.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <CreditCard className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#6EC1B4]" />
            <span>
              <span className="text-gray-400">Thanh toán: </span>
              {data.thanh_toan.join(', ')}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

function AppointmentsCard({ data }: { data: any }) {
  const items: any[] = data?.lich_hen ?? [];
  if (!items.length) return <EmptyHint text="Bạn chưa có lịch hẹn nào." />;
  return (
    <div className="space-y-2">
      {items.map((a, i) => {
        const st = APPT_STATUS[a.trang_thai] ?? { label: a.trang_thai, cls: 'bg-gray-100 text-gray-500' };
        return (
          <Card key={i}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c]">
                <CalendarCheck className="h-4 w-4 text-[#6EC1B4]" />
                {a.ngay} · {a.gio}
              </div>
              <Badge label={st.label} cls={st.cls} />
            </div>
            <p className="mt-1.5 text-xs text-gray-600">
              {[a.bac_si && `BS. ${a.bac_si}`, a.dich_vu].filter(Boolean).join(' · ') || 'Khám tư vấn'}
            </p>
            {a.so_thu_tu != null && (
              <p className="mt-1 text-[11px] text-gray-400">Số thứ tự: {a.so_thu_tu}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function InvoicesCard({ data }: { data: any }) {
  const items: any[] = data?.hoa_don ?? [];
  if (!items.length) return <EmptyHint text="Bạn chưa có hóa đơn nào." />;
  return (
    <div className="space-y-2">
      {items.map((inv, i) => {
        const st = PAY_STATUS[inv.trang_thai] ?? { label: inv.trang_thai, cls: 'bg-gray-100 text-gray-500' };
        const paid = inv.trang_thai === 'paid';
        return (
          <Card key={i}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c]">
                <Receipt className="h-4 w-4 text-[#6EC1B4]" />
                {inv.ma}
              </div>
              <span className="text-sm font-bold text-[#1a3a5c]">{vnd(inv.so_tien_vnd)}</span>
            </div>
            {inv.mo_ta && <p className="mt-1 line-clamp-1 text-xs text-gray-500">{inv.mo_ta}</p>}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex items-center gap-1">
                {paid ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-amber-600" />
                )}
                <Badge label={st.label} cls={st.cls} />
              </span>
              {inv.phuong_thuc && (
                <span className="text-[11px] text-gray-400">{PAY_METHOD[inv.phuong_thuc] ?? inv.phuong_thuc}</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/** Bộ điều phối: chọn renderer theo card.type. */
export default function ChatCards({ cards }: { cards: CardEvent[] }) {
  return (
    <div className="mt-2 space-y-2">
      {cards.map((card, i) => {
        switch (card.type) {
          case 'services':
            return <ServicesCard key={i} data={card.data} />;
          case 'doctors':
            return <DoctorsCard key={i} data={card.data} />;
          case 'availability':
            return <AvailabilityCard key={i} data={card.data} />;
          case 'clinic':
            return <ClinicCard key={i} data={card.data} />;
          case 'appointments':
            return <AppointmentsCard key={i} data={card.data} />;
          case 'invoices':
            return <InvoicesCard key={i} data={card.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
