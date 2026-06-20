import type { Appointment } from '../types/appointment.types';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-primary' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700' },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600' },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-500' },
};

const STEPS = ['pending', 'confirmed', 'checked_in', 'in_progress', 'done'];
const STEP_LABEL: Record<string, string> = {
  pending: 'Chờ', confirmed: 'Xác nhận', checked_in: 'Check-in', in_progress: 'Khám', done: 'Xong',
};

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, day] = iso.split('-');
  const d = new Date(Number(y), Number(m) - 1, Number(day));
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return `${dow}, ${day}/${m}/${y}`;
};

export function PatientAppointmentCard({ apt, onCancel }: { apt: Appointment; onCancel: (apt: Appointment) => void }) {
  const canCancel = ['pending', 'confirmed'].includes(apt.status);
  const isUpcoming = ['pending', 'confirmed', 'checked_in', 'in_progress'].includes(apt.status);
  const curIdx = STEPS.indexOf(apt.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-shrink-0 w-16 text-center">
          <div className="text-2xl font-bold text-primary">{apt.time}</div>
          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(apt.date).split(', ')[0]}</div>
        </div>

        <div className="w-px h-12 bg-gray-100 hidden sm:block flex-shrink-0" />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">{apt.doctor.user.name}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS[apt.status]?.cls ?? ''}`}>
              {STATUS[apt.status]?.label ?? apt.status}
            </span>
            {apt.queueNumber && (
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full font-bold">STT #{apt.queueNumber}</span>
            )}
          </div>
          <div className="text-sm text-gray-500">{fmtDate(apt.date)}</div>
          {apt.service && <div className="text-xs text-gray-400">{apt.service.name}</div>}
          {apt.symptoms && (
            <div className="text-xs text-gray-400 mt-1 line-clamp-1">
              <span className="font-medium">Triệu chứng:</span> {apt.symptoms}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {canCancel && (
            <button onClick={() => onCancel(apt)} className="px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">Huỷ lịch</button>
          )}
        </div>
      </div>

      {isUpcoming && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i, arr) => {
              const thisIdx = STEPS.indexOf(s);
              const done = thisIdx <= curIdx;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-primary' : 'bg-gray-200'}`} />
                  <span className={`text-[10px] ml-1 font-medium hidden sm:block ${done ? 'text-primary' : 'text-gray-400'}`}>{STEP_LABEL[s]}</span>
                  {i < arr.length - 1 && <div className={`flex-1 h-px mx-1 ${thisIdx < curIdx ? 'bg-primary' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
