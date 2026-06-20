import { buildCalendar, isoDate, DAY_LABELS } from '../lib/calendar';
import type { ScheduleWorkDay } from '../hooks/useScheduleManager';

interface Props {
  year: number;
  month: number;
  loading: boolean;
  selDoctorId: string;
  savedDatesMap: Map<string, ScheduleWorkDay>;
  toAdd: string[];
  toRemove: string[];
  onToggle: (iso: string) => void;
}

export function ScheduleCalendar({ year, month, loading, selDoctorId, savedDatesMap, toAdd, toRemove, onToggle }: Props) {
  const calendar = buildCalendar(year, month);
  const todayStr = isoDate(new Date());

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_LABELS.map(d => (
          <div key={d} className={`py-3 text-xs font-bold text-center uppercase tracking-wide ${d === 'CN' ? 'text-red-300 bg-red-50/50' : 'text-gray-500'}`}>{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 text-sm">Đang tải...</div>
      ) : (
        calendar.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
            {week.map((date, di) => {
              const iso = date ? isoDate(date) : null;
              const isToday = iso === todayStr;
              const isSunday = di === 6;
              const isSaved = iso ? savedDatesMap.has(iso) : false;
              const isAdding = iso ? toAdd.includes(iso) : false;
              const isRemoving = iso ? toRemove.includes(iso) : false;
              const wd = iso ? savedDatesMap.get(iso) ?? null : null;
              const canClick = !!date && !isSunday && !!selDoctorId;

              let cellBg = '';
              let cursor = '';
              if (!date) cellBg = 'bg-gray-50/20';
              else if (isSunday) { cellBg = 'bg-red-50/30'; cursor = 'cursor-not-allowed'; }
              else if (isRemoving) { cellBg = 'bg-red-50 ring-1 ring-inset ring-red-300'; cursor = 'cursor-pointer'; }
              else if (isAdding) { cellBg = 'bg-[#1a3a5c]/8 ring-1 ring-inset ring-[#1a3a5c]/30'; cursor = 'cursor-pointer'; }
              else if (isSaved) { cellBg = 'bg-teal-50'; cursor = canClick ? 'cursor-pointer' : ''; }
              else if (canClick) { cellBg = 'hover:bg-blue-50'; cursor = 'cursor-pointer'; }

              let dayNumClass = 'text-gray-600';
              if (isToday && !isAdding && !isRemoving) dayNumClass = 'bg-[#1a3a5c] text-white';
              else if (isAdding) dayNumClass = 'bg-[#1a3a5c] text-white';
              else if (isRemoving) dayNumClass = 'bg-red-500 text-white';
              else if (isSaved) dayNumClass = 'text-teal-700 font-bold';
              else if (isSunday) dayNumClass = 'text-red-300';

              return (
                <div
                  key={di}
                  onClick={() => { if (canClick && iso) onToggle(iso); }}
                  className={['min-h-[76px] border-r border-gray-100 last:border-0 p-2 transition-all duration-150 select-none', cellBg, cursor].join(' ')}
                >
                  {date && (
                    <>
                      <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${dayNumClass}`}>{date.getDate()}</div>
                      {isSaved && !isRemoving && (
                        <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold truncate bg-teal-100 text-teal-700">{wd?.room?.name ?? 'Đã phân'}</div>
                      )}
                      {isRemoving && (
                        <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold truncate bg-red-100 text-red-600 flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          Sẽ xóa
                        </div>
                      )}
                      {isAdding && (
                        <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5 bg-[#1a3a5c]/15 text-[#1a3a5c] flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Đã chọn
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
