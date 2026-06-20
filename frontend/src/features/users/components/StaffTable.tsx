import { imgSrc } from '@/shared/lib/utils';
import { fmtMoney, initials } from '@/shared/lib/format';
import { roleLabel } from '../lib/staff';
import type { StaffRole, UserRecord } from '../types/user.types';

const avatarCls: Record<StaffRole, string> = {
  doctor: 'bg-green-100 text-green-700',
  receptionist: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-red-100 text-red-700',
};
const badgeCls: Record<StaffRole, string> = {
  doctor: 'bg-green-50 text-green-700',
  receptionist: 'bg-indigo-50 text-indigo-700',
  admin: 'bg-red-50 text-red-700',
};

interface Props {
  role: StaffRole;
  staff: UserRecord[];
  loading: boolean;
  onEdit: (u: UserRecord) => void;
  onDelete: (u: UserRecord) => void;
}

export function StaffTable({ role, staff, loading, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-16 text-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
      ) : staff.length === 0 ? (
        <div className="p-16 text-center text-gray-400 text-sm">Chưa có nhân sự nào.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân sự</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                {role === 'doctor' && (
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Chuyên khoa / Phí khám</th>
                )}
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={imgSrc(u.avatar)!} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarCls[role]}`}>
                          {initials(u.name)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${badgeCls[role]}`}>
                          {roleLabel[role]}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-gray-700">{u.phone}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{u.email ?? '—'}</div>
                  </td>
                  {role === 'doctor' && (
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="text-gray-700">{u.doctorProfile?.specialty ?? '—'}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{fmtMoney(u.doctorProfile?.consultationFee)}</div>
                    </td>
                  )}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(u)} className="text-xs px-3 py-1.5 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors">Sửa</button>
                      <button onClick={() => onDelete(u)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">Xoá</button>
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
