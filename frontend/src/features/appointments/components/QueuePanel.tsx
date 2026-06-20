import { useState } from 'react';
import type { Appointment } from '../types/appointment.types';

export function QueuePanel({ queue, loading }: { queue: Appointment[]; loading: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = queue.reduce<Record<string, Appointment[]>>((acc, q) => {
    const key = q.doctor.user.name;
    (acc[key] ??= []).push(q);
    return acc;
  }, {});

  const toggle = (name: string) => setExpanded(p => (p === name ? null : name));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-base">Hàng chờ hôm nay</h2>
        <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full font-bold">{queue.length} người</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : queue.length === 0 ? (
        <div className="p-10 text-center text-gray-400">
          <div className="text-3xl mb-2">🪑</div>
          <p className="text-sm">Chưa có ai trong hàng chờ</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
          {Object.entries(grouped).map(([docName, items]) => {
            const inProgress = items.find(q => q.status === 'in_progress');
            const isOpen = expanded === docName;
            return (
              <div key={docName}>
                <button onClick={() => toggle(docName)} className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {docName.replace(/^BS\.\s*/i, '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{docName}</div>
                    {inProgress && <div className="text-xs text-purple-600 font-medium truncate">Đang khám: {inProgress.patientName}</div>}
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full font-bold flex-shrink-0">{items.length} chờ</span>
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                    {items.map((q, i) => (
                      <div key={q.id} className="px-5 py-2.5 flex items-center gap-3 pl-8">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          q.status === 'in_progress' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {q.queueNumber ?? i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{q.patientName}</div>
                          <div className="text-xs text-gray-400">{q.time}</div>
                        </div>
                        {q.status === 'in_progress' && (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold flex-shrink-0">Đang khám</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
