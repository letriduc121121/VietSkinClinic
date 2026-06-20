import { Alert } from '@/shared/components/Alert';
import { useMyWorkDays } from '@/features/work-days/hooks/useMyWorkDays';
import { MyWorkCalendar } from '@/features/work-days/components/MyWorkCalendar';
import { MONTH_NAMES, VN_WEEKDAYS, isoDate } from '@/features/work-days/lib/calendar';

export default function WorkSchedulePage() {
  const { year, month, workDays, loading, error, navMonth, goToday, isCurrentMonth } = useMyWorkDays();

  const todayStr = isoDate(new Date());
  const workMap = new Map(workDays.map(wd => [wd.date.split('T')[0], wd]));
  const sortedDays = [...workDays].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingDays = sortedDays.filter(wd => wd.date.split('T')[0] >= todayStr);
  const listDays = isCurrentMonth ? upcomingDays : sortedDays;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Lịch làm việc của tôi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Lịch làm việc được phân công bởi quản trị viên theo từng tháng.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 text-lg">{MONTH_NAMES[month]} {year}</span>
            <div className="flex items-center gap-2">
              <button onClick={goToday} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all text-xs font-bold text-gray-600">Hôm nay</button>
              <button onClick={() => navMonth(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => navMonth(1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-teal-400 inline-block" />Ngày làm việc</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-[#1a3a5c] inline-block" />Hôm nay</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border-2 border-dashed border-gray-300 inline-block" />Chủ nhật</span>
          </div>

          <MyWorkCalendar year={year} month={month} loading={loading} workMap={workMap} />
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{MONTH_NAMES[month]} {year}</p>
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-teal-600">{workDays.length}</div>
              <div className="text-xs text-teal-600 mt-0.5">ngày làm việc trong tháng</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{isCurrentMonth ? 'Ngày làm việc sắp tới' : 'Các ngày làm việc'}</p>
            {loading ? (
              <p className="text-sm text-gray-400">Đang tải...</p>
            ) : listDays.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có ngày làm việc nào.</p>
            ) : (
              <ul className="space-y-2">
                {listDays.map(wd => {
                  const dt = new Date(wd.date);
                  const isToday = wd.date.split('T')[0] === todayStr;
                  return (
                    <li key={wd.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${isToday ? 'bg-[#1a3a5c]/5 border-[#1a3a5c]/20' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex flex-col items-center justify-center flex-shrink-0 leading-none">
                        <span className="text-sm font-bold">{dt.getDate()}</span>
                        <span className="text-[9px]">Th{dt.getMonth() + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800">
                          {VN_WEEKDAYS[dt.getDay()]}
                          {isToday && <span className="ml-2 text-[10px] text-[#1a3a5c] font-bold">• Hôm nay</span>}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{wd.roomName ? `Phòng: ${wd.roomName}` : 'Đi làm'}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
