import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { imgSrc } from '@/shared/lib/utils';
import { Alert } from '@/shared/components/Alert';
import { useBooking, type BookingInit } from '@/features/appointments/hooks/useBooking';
import { BookingCalendar } from '@/features/appointments/components/BookingCalendar';
import { SlotPicker } from '@/features/appointments/components/SlotPicker';
import { fmtVN } from '@/features/appointments/lib/booking';

const STEPS = ['Chọn bác sĩ', 'Chọn ngày & giờ', 'Xác nhận'];

export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Chọn sẵn từ chatbot: /patient/booking?doctorId=&date=&time=
  const initial = useMemo<BookingInit | undefined>(() => {
    const doctorId = searchParams.get('doctorId');
    if (!doctorId) return undefined;
    return {
      doctorId: Number(doctorId),
      date: searchParams.get('date') ?? undefined,
      time: searchParams.get('time') ?? undefined,
    };
  }, [searchParams]);

  const {
    doctors, services, selectedDoctor, selectDoctor,
    selectedDate, setSelectedDate, slotData, slotLoading, selectedSlot, setSelectedSlot,
    form, setForm, loading, error, submitted, submit, reset,
  } = useBooking(initial);
  const [step, setStep] = useState(1);

  // Khi bác sĩ đã được chọn sẵn từ deep-link → nhảy thẳng sang bước chọn ngày & giờ.
  const advanced = useRef(false);
  useEffect(() => {
    if (advanced.current || !initial?.doctorId) return;
    if (selectedDoctor?.id === initial.doctorId) {
      advanced.current = true;
      setStep(2);
    }
  }, [selectedDoctor, initial]);

  const resetBooking = () => { reset(); setStep(1); };

  if (submitted) return (
    <div className="max-w-md mx-auto mt-12 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Đặt lịch thành công!</h2>
        <p className="text-gray-500 mt-2">
          Lịch hẹn với <strong>{selectedDoctor?.user.name}</strong> vào <strong>{fmtVN(selectedDate)}</strong> lúc <strong>{selectedSlot}</strong> đã được gửi.
        </p>
        <p className="text-sm text-amber-600 mt-3 bg-amber-50 px-4 py-2 rounded-xl">
          Vui lòng đến quầy lễ tân để xác nhận và thanh toán phí khám trước khi vào phòng.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/patient/appointments')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Xem lịch hẹn</button>
        <button onClick={resetBooking} className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all">Đặt lịch mới</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đặt lịch khám</h1>
        <p className="text-gray-500 mt-1 text-sm">Chọn bác sĩ, ngày giờ và xác nhận thông tin.</p>
      </div>

      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : n}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${active ? 'text-primary' : done ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Chọn bác sĩ</h2>
          {doctors.length === 0 ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => { selectDoctor(doc); setStep(2); }}
                  className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${selectedDoctor?.id === doc.id ? 'border-primary bg-blue-50' : 'border-gray-100 bg-white hover:border-primary/40'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 overflow-hidden">
                      {doc.user.avatar ? <img src={imgSrc(doc.user.avatar)!} alt={doc.user.name} className="w-full h-full object-cover" /> : doc.user.name.split(' ').pop()?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{doc.user.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{doc.specialty || 'Da liễu & Thẩm mỹ'}</div>
                      {doc.description && <div className="text-xs text-gray-400 mt-2 line-clamp-2">{doc.description}</div>}
                      <div className="mt-3">
                        <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">💳 {Number(doc.consultationFee).toLocaleString('vi-VN')}đ / lần khám</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedDoctor && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-primary/20">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                {selectedDoctor.user.avatar ? <img src={imgSrc(selectedDoctor.user.avatar)!} alt={selectedDoctor.user.name} className="w-full h-full object-cover" /> : selectedDoctor.user.name.split(' ').pop()?.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm">{selectedDoctor.user.name}</div>
                <div className="text-xs text-gray-500">{selectedDoctor.specialty}</div>
              </div>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-primary font-bold hover:underline">Đổi</button>
            </div>

            <BookingCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">← Quay lại</button>
              <button disabled={!selectedDate || !selectedSlot} onClick={() => setStep(3)} className="flex-1 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed">Tiếp tục →</button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <SlotPicker selectedDate={selectedDate} slotData={slotData} slotLoading={slotLoading} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
          </div>
        </div>
      )}

      {step === 3 && selectedDoctor && selectedDate && selectedSlot && (
        <div className="space-y-5 max-w-xl">
          <h2 className="font-bold text-lg">Xác nhận thông tin</h2>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            {[
              { label: 'Bác sĩ', value: selectedDoctor.user.name },
              { label: 'Ngày khám', value: fmtVN(selectedDate) },
              { label: 'Giờ khám', value: selectedSlot },
              { label: 'Phí khám', value: `${Number(selectedDoctor.consultationFee).toLocaleString('vi-VN')}đ` },
            ].map(f => (
              <div key={f.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{f.label}</span>
                <span className="font-bold text-sm">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-2xl border border-primary/20 p-5 space-y-3">
            <div className="font-bold text-sm text-primary">Thông tin bệnh nhân</div>
            {[{ label: 'Họ tên', value: user?.name }, { label: 'SĐT', value: user?.phone }].map(f => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{f.label}</span>
                <span className="font-semibold">{f.value}</span>
              </div>
            ))}
          </div>

          {services.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dịch vụ quan tâm (tùy chọn)</label>
              <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Chưa xác định</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} — {Number(s.price).toLocaleString('vi-VN')}đ</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả triệu chứng (tùy chọn)</label>
            <textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} rows={3} placeholder="Ví dụ: Da nổi mụn viêm vùng má, ngứa và đỏ..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">
            ⚠️ Vui lòng đến quầy lễ tân thanh toán phí khám trước khi vào phòng.
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">← Quay lại</button>
            <button onClick={submit} disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Đang xử lý...' : '✓ Xác nhận đặt lịch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
