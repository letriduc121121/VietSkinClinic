import { useMemo, useState } from 'react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useStaff } from '@/features/users/hooks/useStaff';
import { STAFF_ROLES, roleLabel } from '@/features/users/lib/staff';
import type { StaffRole, UserRecord } from '@/features/users/types/user.types';
import { StaffTable } from '@/features/users/components/StaffTable';
import { StaffCreateDialog } from '@/features/users/components/StaffCreateDialog';
import { StaffEditDialog } from '@/features/users/components/StaffEditDialog';

export default function StaffManagementPage() {
  const { staff, loading, specialties, degrees, create, update, remove } = useStaff();
  const [tab, setTab] = useState<StaffRole>('doctor');
  const [search, setSearch] = useState('');

  const createDlg = useDisclosure();
  const editDlg = useDisclosure<UserRecord>();
  const del = useDisclosure<UserRecord>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter(u => {
      if (u.role?.code !== tab) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.doctorProfile?.specialty ?? '').toLowerCase().includes(q)
      );
    });
  }, [staff, tab, search]);

  const confirmDelete = async () => {
    if (!del.data) return;
    setDeleting(true); setDeleteError('');
    try {
      await remove(del.data);
      del.close();
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message ?? 'Không thể xoá tài khoản.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý nhân sự"
        subtitle="Bác sĩ và lễ tân làm việc tại phòng khám."
        actions={
          <button
            onClick={createDlg.open}
            className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0f2540] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm nhân sự
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {STAFF_ROLES.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(''); }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-[#1a3a5c] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {roleLabel[t]}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'bg-gray-200 text-gray-500'
              }`}>
                {staff.filter(u => u.role?.code === t).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'doctor' ? 'Tên, SĐT, chuyên khoa...' : 'Tên, SĐT, email...'}
            className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white"
          />
        </div>
        {search && <span className="text-xs text-gray-400">{filtered.length} kết quả</span>}
      </div>

      <StaffTable role={tab} staff={filtered} loading={loading} onEdit={editDlg.openWith} onDelete={del.openWith} />

      {createDlg.isOpen && (
        <StaffCreateDialog specialties={specialties} degrees={degrees} onClose={createDlg.close} onCreate={create} />
      )}

      {editDlg.isOpen && editDlg.data && (
        <StaffEditDialog target={editDlg.data} specialties={specialties} degrees={degrees} onClose={editDlg.close} onUpdate={update} />
      )}

      {del.isOpen && del.data && (
        <ConfirmDialog
          title="Xoá tài khoản nhân sự"
          message={<>Bạn có chắc muốn xoá tài khoản <strong>{del.data.name}</strong>? Tài khoản sẽ bị vô hiệu hoá, dữ liệu lịch sử vẫn được giữ nguyên.</>}
          error={deleteError}
          loading={deleting}
          onClose={del.close}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
