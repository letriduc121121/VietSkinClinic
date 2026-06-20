import { imgSrc } from '@/shared/lib/utils';
import type { Room } from '../types/room.types';

interface Props {
  room: Room;
  toggling: boolean;
  onEdit: (r: Room) => void;
  onToggle: (r: Room) => void;
}

export function RoomCard({ room: r, toggling, onEdit, onToggle }: Props) {
  const docName = r.doctor?.user?.name ?? null;
  const docAvatar = r.doctor?.user?.avatar ?? null;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-6 space-y-4 transition-all ${r.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.active ? 'bg-[#1a3a5c]/10' : 'bg-gray-100'}`}>
        <svg className={`w-6 h-6 ${r.active ? 'text-[#1a3a5c]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>

      <div>
        <div className="font-bold text-gray-900">{r.name}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${r.active ? 'bg-green-400' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500">{r.active ? 'Đang hoạt động' : 'Tạm ngừng'}</span>
        </div>
      </div>

      <div className="border-t border-gray-50 pt-3">
        {docName ? (
          <div className="flex items-center gap-2.5">
            {docAvatar ? (
              <img src={imgSrc(docAvatar)!} alt={docName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {docName.split(' ').pop()?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs text-gray-400">Bác sĩ phụ trách</div>
              <div className="text-sm font-semibold text-gray-700 truncate">{docName}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Chưa gán bác sĩ
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onEdit(r)} className="flex-1 text-xs px-3 py-2 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors">Chỉnh sửa</button>
        <button
          onClick={() => onToggle(r)}
          disabled={toggling}
          className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${r.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
        >
          {toggling ? '...' : r.active ? 'Tắt' : 'Bật'}
        </button>
      </div>
    </div>
  );
}
