import { useRef, useState } from 'react';
import { Alert } from '@/shared/components/Alert';
import { useScheduleManager } from '@/features/work-days/hooks/useScheduleManager';
import { ScheduleCalendar } from '@/features/work-days/components/ScheduleCalendar';
import { MONTH_NAMES } from '@/features/work-days/lib/calendar';

export default function ScheduleManagementPage() {
  const {
    year, month, doctors, loading, selDoctorId, selectDoctor,
    selDoctor, selDocWorkDays, savedDatesMap, toAdd, toRemove, hasChanges,
    saving, saveErr, navMonth, toggle, save,
  } = useScheduleManager();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = async () => {
    const msg = await save();
    if (!msg) return;
    setSuccessMsg(msg);
    setShowSuccess(true);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setShowSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Lưu lịch thành công</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {successMsg} cho <strong className="text-gray-700">{selDoctor?.user?.name ?? 'bác sĩ'}</strong>
                </p>
              </div>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">Đóng</button>
            </div>
            <div className="h-1 bg-emerald-100">
              <div className="h-full bg-emerald-400 transition-all ease-linear" style={{ width: '100%', animation: 'shrink 3.5s linear forwards' }} />
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch làm việc bác sĩ</h1>
        <p className="text-sm text-gray-500 mt-0.5">Phân công lịch làm việc cho từng bác sĩ theo tháng.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn bác sĩ</p>
            <select value={selDoctorId} onChange={e => selectDoctor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] bg-white">
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.name ?? `BS #${d.id}`}</option>)}
            </select>

            {selDoctor && selDoctor.room && (
              <div className="rounded-xl px-4 py-3 text-sm bg-teal-50 border border-teal-100">
                <div className="flex items-center gap-2 text-teal-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span>Phòng: <strong>{selDoctor.room.name}</strong></span>
                </div>
              </div>
            )}
            {selDoctor && !selDoctor.room && (
              <div className="rounded-xl px-4 py-3 text-sm bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-2 text-amber-700">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Bác sĩ chưa được phân phòng — vui lòng gán phòng trước tại <strong>Quản lý phòng khám</strong></span>
                </div>
              </div>
            )}
            {!selDoctorId && <p className="text-xs text-gray-400 italic">Chọn bác sĩ để bắt đầu phân lịch.</p>}
            {selDoctorId && (
              <div className="text-xs text-[#1a3a5c] bg-[#1a3a5c]/5 px-3 py-2 rounded-lg space-y-0.5">
                <p>• Click vào ô ngày trống để <strong>chọn thêm</strong></p>
                <p>• Click lại ô đã chọn để <strong>hủy chọn</strong></p>
                <p>• Click vào ô đã lưu để <strong>đánh dấu xóa</strong></p>
                <p>• Ấn <strong>"Lưu"</strong> để cập nhật lịch</p>
              </div>
            )}
          </div>

          {selDoctor && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{MONTH_NAMES[month]} {year} — {selDoctor.user?.name}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-teal-600">{selDocWorkDays.length - toRemove.length}</div>
                  <div className="text-xs text-teal-600 mt-0.5">đã phân lịch</div>
                </div>
                <div className="flex-1 bg-[#1a3a5c]/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#1a3a5c]">{toAdd.length}</div>
                  <div className="text-xs text-[#1a3a5c]/70 mt-0.5">đang chọn thêm</div>
                </div>
                {toRemove.length > 0 && (
                  <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{toRemove.length}</div>
                    <div className="text-xs text-red-500/70 mt-0.5">sẽ xóa</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selDoctorId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              {saveErr && <Alert variant="error" className="text-xs px-3 py-2">{saveErr}</Alert>}
              <button onClick={handleSave} disabled={saving || !hasChanges}
                className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Lưu{hasChanges ? ` (${toAdd.length > 0 ? `+${toAdd.length}` : ''}${toAdd.length > 0 && toRemove.length > 0 ? ', ' : ''}${toRemove.length > 0 ? `-${toRemove.length}` : ''})` : ''}
                  </>
                )}
              </button>
              {!hasChanges && <p className="text-xs text-gray-400 text-center">Chưa có thay đổi nào</p>}
            </div>
          )}
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 text-lg">{MONTH_NAMES[month]} {year}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => navMonth(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => navMonth(1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-teal-400 inline-block" />Đã phân lịch</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-[#1a3a5c] inline-block" />Đang chọn thêm</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-400 inline-block" />Sẽ xóa</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border-2 border-dashed border-gray-300 inline-block" />Chủ nhật (không làm việc)</span>
          </div>

          <ScheduleCalendar
            year={year} month={month} loading={loading} selDoctorId={selDoctorId}
            savedDatesMap={savedDatesMap} toAdd={toAdd} toRemove={toRemove} onToggle={toggle}
          />
        </div>
      </div>

      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
}
