import type { Medicine } from '../types/medicine.types';

interface Props {
  medicines: Medicine[];
  onEdit: (m: Medicine) => void;
  onDelete: (m: Medicine) => void;
}

export function MedicineTable({ medicines, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-4 px-6">Tên thuốc</th>
              <th className="py-4 px-6">Đơn vị tính</th>
              <th className="py-4 px-6">Nhóm danh mục</th>
              <th className="py-4 px-6">Mô tả chi tiết</th>
              <th className="py-4 px-6">Ngày tạo</th>
              <th className="py-4 px-6 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
            {medicines.map(m => (
              <tr key={m.id} className="hover:bg-gray-50/40 transition-colors">
                <td className="py-4 px-6 font-bold text-gray-900">{m.name}</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{m.unit || 'Chưa rõ'}</span>
                </td>
                <td className="py-4 px-6">
                  {m.category ? (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{m.category}</span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Chưa phân nhóm</span>
                  )}
                </td>
                <td className="py-4 px-6 max-w-xs truncate" title={m.description || ''}>
                  {m.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                </td>
                <td className="py-4 px-6 text-gray-400 text-xs">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEdit(m)} className="text-xs px-3 py-1.5 bg-blue-50 text-[#1a3a5c] rounded-lg font-semibold hover:bg-blue-100 transition-colors">Sửa</button>
                    <button onClick={() => onDelete(m)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
