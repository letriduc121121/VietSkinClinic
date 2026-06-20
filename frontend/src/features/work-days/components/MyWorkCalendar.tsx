import { buildCalendar, isoDate, DAY_LABELS } from '../lib/calendar';
import type { MyWorkDay } from '../hooks/useMyWorkDays';

interface Props {
  year: number;
  month: number;
  loading: boolean;
  workMap: Map<string, MyWorkDay>;
}

export function MyWorkCalendar({ year, month, loading, workMap }: Props) {
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
        <div className="p-16 text-center text-gray-400 text-sm">
          <div className="flex justify-center mb-2"><div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
          Đang tải lịch...
        </div>
      ) : (
        calendar.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
            {week.map((date, di) => {
              const iso = date ? isoDate(date) : null;
              const isToday = iso === todayStr;
              const isSunday = di === 6;
              const wd = iso ? workMap.get(iso) ?? null : null;
              const isWork = !!wd;

              let cellBg = '';
              if (!date) cellBg = 'bg-gray-50/20';
              else if (isWork) cellBg = 'bg-teal-50';
              else if (isSunday) cellBg = 'bg-red-50/30';

              let dayNumClass = 'text-gray-600';
              if (isToday) dayNumClass = 'bg-[#1a3a5c] text-white';
              else if (isWork) dayNumClass = 'text-teal-700 font-bold';
              else if (isSunday) dayNumClass = 'text-red-300';

              return (
                <div key={di} className={['min-h-[76px] border-r border-gray-100 last:border-0 p-2 select-none', cellBg].join(' ')}>
                  {date && (
                    <>
                      <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${dayNumClass}`}>{date.getDate()}</div>
                      {isWork && <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold truncate bg-teal-100 text-teal-700">{wd?.roomName ?? 'Đi làm'}</div>}
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
