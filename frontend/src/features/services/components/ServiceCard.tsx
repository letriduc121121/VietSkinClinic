import { imgSrc } from '@/shared/lib/utils';
import { fmtPrice } from '../lib/service';
import type { Service } from '../types/service.types';

interface Props {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}

export function ServiceCard({ service: s, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      {s.imageUrl ? (
        <div className="h-40 bg-gray-100 overflow-hidden">
          <img src={imgSrc(s.imageUrl)!} alt={s.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center">
          <svg className="w-14 h-14 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 leading-snug">{s.name}</h3>
        </div>

        {s.category && (
          <span className="inline-block text-[11px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium mb-3 w-fit">
            {s.category}
          </span>
        )}

        {s.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{s.description}</p>}

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Giá</span>
            <span className="font-bold text-[#1a3a5c]">{fmtPrice(s.price)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Thời gian</span>
            <span className="font-semibold text-gray-700">{s.duration} phút</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => onEdit(s)} className="flex-1 text-xs py-2 bg-blue-50 text-[#1a3a5c] rounded-xl font-semibold hover:bg-blue-100 transition-colors">Sửa</button>
          <button onClick={() => onDelete(s)} className="flex-1 text-xs py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors">Xoá</button>
        </div>
      </div>
    </div>
  );
}
