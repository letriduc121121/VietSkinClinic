import { useState } from 'react';
import { buildMonthGrid, DOW_LABELS, MONTH_NAMES } from '../lib/booking';

export function BookingCalendar({ selectedDate, onSelect }: { selectedDate: string; onSelect: (iso: string) => void }) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();
  const grid = buildMonthGrid(calYear, calMonth);

  const prev = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const next = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={prev} disabled={isCurrentMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-sm">{MONTH_NAMES[calMonth]} {calYear}</span>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className={`text-center text-xs font-bold pb-2 ${d === 'CN' ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-4">
        {grid.map((cell, idx) => {
          if (!cell) return <div key={`e-${idx}`} />;
          const isSelected = selectedDate === cell.iso;
          const isWeekend = new Date(cell.iso).getDay() === 0;
          return (
            <button
              key={cell.iso}
              disabled={cell.disabled}
              onClick={() => onSelect(cell.iso)}
              className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                cell.disabled ? 'text-gray-300 cursor-not-allowed'
                  : isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : cell.today ? 'ring-2 ring-primary/40 text-primary font-bold hover:bg-primary hover:text-white'
                  : isWeekend ? 'text-red-400 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {cell.day}
              {cell.today && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary/20 ring-2 ring-primary/40 inline-block" />Hôm nay</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" />Đã chọn</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />Không khả dụng</span>
      </div>
    </div>
  );
}
