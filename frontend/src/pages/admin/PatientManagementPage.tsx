import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { usePatients } from '@/features/users/hooks/usePatients';
import type { UserRecord } from '@/features/users/types/user.types';
import { PatientTable } from '@/features/users/components/PatientTable';
import { PatientFormDialog } from '@/features/users/components/PatientFormDialog';
import { PatientDetailDialog } from '@/features/users/components/PatientDetailDialog';

export default function PatientManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.code === 'admin';

  const { patients, total, loading, search, setSearch, getFull, create, update, remove } = usePatients();

  const detail = useDisclosure<UserRecord>();
  const form = useDisclosure<UserRecord>();
  const del = useDisclosure<UserRecord>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
        title="Hồ sơ bệnh nhân"
        subtitle="Danh sách tất cả bệnh nhân đã đăng ký."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-72 shadow-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên, SĐT, mã BN..."
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={form.open}
              className="flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Thêm bệnh nhân
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="bg-[#1a3a5c]/10 text-[#1a3a5c] font-semibold px-3 py-1 rounded-full text-xs">{patients.length} bệnh nhân</span>
        {search.trim() && <span className="text-gray-400">trong tổng {total}</span>}
      </div>

      <PatientTable
        patients={patients}
        loading={loading}
        isAdmin={isAdmin}
        onDetail={detail.openWith}
        onEdit={form.openWith}
        onDelete={del.openWith}
      />

      {detail.isOpen && detail.data && (
        <PatientDetailDialog target={detail.data} onClose={detail.close} onPatientUpdated={() => { /* list tự refresh khi mở lại */ }} />
      )}

      {form.isOpen && (
        <PatientFormDialog target={form.data} getFull={getFull} onClose={form.close} onCreate={create} onUpdate={update} />
      )}

      {del.isOpen && del.data && (
        <ConfirmDialog
          title="Xoá tài khoản bệnh nhân"
          message={<>Bạn có chắc muốn xoá tài khoản <strong>{del.data.name}</strong>? Tài khoản sẽ bị vô hiệu hoá, lịch sử khám và bệnh án vẫn được giữ nguyên.</>}
          error={deleteError}
          loading={deleting}
          onClose={del.close}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
