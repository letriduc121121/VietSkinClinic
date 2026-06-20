import { useState } from 'react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useServices } from '@/features/services/hooks/useServices';
import type { Service } from '@/features/services/types/service.types';
import { ServiceCard } from '@/features/services/components/ServiceCard';
import { ServiceFormDialog } from '@/features/services/components/ServiceFormDialog';

export default function ServiceManagementPage() {
  const { services, loading, search, setSearch, categories, create, update, remove } = useServices();

  const form = useDisclosure<Service>();
  const del = useDisclosure<Service>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    if (!del.data) return;
    setDeleting(true); setDeleteError('');
    try {
      await remove(del.data);
      del.close();
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message ?? 'Không thể xoá dịch vụ.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dịch vụ & Giá"
        subtitle="Quản lý danh mục dịch vụ và bảng giá."
        actions={
          <button
            onClick={form.open}
            className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm dịch vụ
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-72 shadow-sm">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, danh mục..."
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
      </div>

      {search.trim() && (
        <div className="text-sm text-gray-500">
          Tìm thấy <span className="font-semibold text-gray-700">{services.length}</span> dịch vụ
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">Đang tải...</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          {search.trim() ? 'Không tìm thấy dịch vụ phù hợp.' : 'Chưa có dịch vụ nào.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {services.map(s => (
            <ServiceCard key={s.id} service={s} onEdit={form.openWith} onDelete={del.openWith} />
          ))}
        </div>
      )}

      {form.isOpen && (
        <ServiceFormDialog target={form.data} categories={categories} onClose={form.close} onCreate={create} onUpdate={update} />
      )}

      {del.isOpen && del.data && (
        <ConfirmDialog
          title="Xoá dịch vụ"
          message={<>Bạn có chắc muốn xoá dịch vụ <strong>{del.data.name}</strong>? Hành động này không thể hoàn tác.</>}
          error={deleteError}
          loading={deleting}
          onClose={del.close}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
