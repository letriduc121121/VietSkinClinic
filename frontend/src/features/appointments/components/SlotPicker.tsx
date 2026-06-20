import type { DoctorSlot, DoctorSlotData } from '@/features/doctors/types/doctor.types';
import { fmtVN } from '../lib/booking';

function SlotButton({ slot, selected, onSelect }: { slot: DoctorSlot; selected: boolean; onSelect: (t: string) => void }) {
  return (
    <button
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
        !slot.available ? 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
          : selected ? 'border-primary bg-primary text-white shadow-md shadow-primary/25 scale-105'
          : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:border-primary hover:scale-105'
      }`}
    >
      {slot.time}
    </button>
  );
}

interface Props {
  selectedDate: string;
  slotData: DoctorSlotData | null;
  slotLoading: boolean;
  selectedSlot: string;
  onSelect: (t: string) => void;
}

export function SlotPicker({ selectedDate, slotData, slotLoading, selectedSlot, onSelect }: Props) {
  const morning = slotData?.slots.filter(s => s.time < '12:00') ?? [];
  const afternoon = slotData?.slots.filter(s => s.time >= '13:00') ?? [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      <div className="px-5 py-4 border-b border-gray-100">
        {selectedDate ? (
          <>
            <div className="font-bold text-sm">{fmtVN(selectedDate)}</div>
            {slotData?.workDay && <div className="text-xs text-gray-400 mt-0.5">📍 {slotData.workDay.room}</div>}
          </>
        ) : (
          <div className="font-bold text-sm text-gray-400">Chọn ngày để xem giờ trống</div>
        )}
      </div>

      {!selectedDate ? (
        <div className="py-14 text-center text-gray-300">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-sm">Chọn ngày trên lịch</p>
        </div>
      ) : slotLoading ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Đang tải lịch...</p>
        </div>
      ) : !slotData?.workDay ? (
        <div className="py-14 text-center text-gray-400 px-4">
          <div className="text-3xl mb-3">🏖️</div>
          <p className="text-sm font-semibold">Bác sĩ không làm việc</p>
          <p className="text-xs mt-1 text-gray-400">Vui lòng chọn ngày khác</p>
        </div>
      ) : (
        <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/40 inline-block" />Còn trống</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />Đã chọn</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 inline-block" />Đã đặt</span>
          </div>

          {morning.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Buổi sáng</span>
                <span className="text-xs text-gray-400">08:00 – 11:40</span>
                <span className="ml-auto text-xs text-green-600 font-bold">{morning.filter(s => s.available).length} trống</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {morning.map(s => <SlotButton key={s.time} slot={s} selected={selectedSlot === s.time} onSelect={onSelect} />)}
              </div>
            </div>
          )}

          {afternoon.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Buổi chiều</span>
                <span className="text-xs text-gray-400">13:00 – 16:40</span>
                <span className="ml-auto text-xs text-green-600 font-bold">{afternoon.filter(s => s.available).length} trống</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {afternoon.map(s => <SlotButton key={s.time} slot={s} selected={selectedSlot === s.time} onSelect={onSelect} />)}
              </div>
            </div>
          )}

          {selectedSlot && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl mt-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-bold text-primary">Đã chọn: {selectedSlot}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
