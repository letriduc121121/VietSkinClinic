import type { UserRecord } from '../types/user.types';
import { genderLabel } from '../lib/patient';
import { fmtDate, initials } from '@/shared/lib/format';

interface Props {
  patients: UserRecord[];
  loading: boolean;
  isAdmin: boolean;
  onDetail: (u: UserRecord) => void;
  onEdit: (u: UserRecord) => void;
  onDelete: (u: UserRecord) => void;
}

export function PatientTable({ patients, loading, isAdmin, onDetail, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-16 text-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
      ) : patients.length === 0 ? (
        <div className="p-16 text-center text-gray-400 text-sm">Không tìm thấy bệnh nhân nào.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Bệnh nhân</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày sinh / Giới tính</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(u.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{u.patientProfile?.patientCode ?? `#${u.id}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-gray-700">{u.phone}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{u.email ?? '—'}</div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="text-gray-700">{fmtDate(u.patientProfile?.dateOfBirth)}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{genderLabel[u.patientProfile?.gender ?? ''] ?? '—'}</div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-gray-500">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onDetail(u)} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">Chi tiết</button>
                      <button onClick={() => onEdit(u)} className="text-xs px-3 py-1.5 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors">Sửa</button>
                      {isAdmin && (
                        <button onClick={() => onDelete(u)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">Xoá</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
