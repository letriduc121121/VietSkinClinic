import { useState } from 'react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useMedicines } from '@/features/medicines/hooks/useMedicines';
import type { Medicine } from '@/features/medicines/types/medicine.types';
import { MedicineTable } from '@/features/medicines/components/MedicineTable';
import { MedicineFormDialog } from '@/features/medicines/components/MedicineFormDialog';

export default function MedicineManagementPage() {
  const { medicines, loading, search, setSearch, categories, units, create, update, remove } = useMedicines();

  const form = useDisclosure<Medicine>();
  const del = useDisclosure<Medicine>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    if (!del.data) return;
    setDeleting(true); setDeleteError('');
    try {
      await remove(del.data);
      del.close();
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message || 'Không thể xoá thuốc.');
    } finally {
      setDeleting(false);
    }
  };

  const addButton = (
    <button onClick={form.open} className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md flex-shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Thêm thuốc mới
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Danh mục thuốc" subtitle="Quản lý danh sách, đơn vị tính và danh mục các loại thuốc dùng kê đơn." actions={addButton} />

      {!loading && medicines.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">{medicines.length} loại thuốc hoạt động</span>
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3a5c]" />
              <span className="text-sm font-medium text-gray-700">{categories.length} nhóm danh mục</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80 bg-gray-50 focus-within:bg-white focus-within:border-[#1a3a5c] focus-within:ring-2 focus-within:ring-[#1a3a5c]/10 transition-all">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, đơn vị, nhóm danh mục..." className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400" />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {search.trim() && (
        <div className="text-sm text-gray-500">
          Tìm thấy <span className="font-semibold text-gray-700">{medicines.length}</span> loại thuốc phù hợp
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Đang tải danh sách thuốc...
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-4xl mb-3">💊</div>
          <div className="font-semibold text-gray-600 mb-1">Không tìm thấy kết quả nào</div>
          <div className="text-sm text-gray-400 mb-4">{search.trim() ? 'Hãy thử điều chỉnh lại từ khoá tìm kiếm.' : 'Chưa có loại thuốc nào trong hệ thống.'}</div>
          {!search.trim() && (
            <button onClick={form.open} className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all">Thêm thuốc ngay</button>
          )}
        </div>
      ) : (
        <MedicineTable medicines={medicines} onEdit={form.openWith} onDelete={del.openWith} />
      )}

      {form.isOpen && (
        <MedicineFormDialog target={form.data} categories={categories} units={units} onClose={form.close} onCreate={create} onUpdate={update} />
      )}

      {del.isOpen && del.data && (
        <ConfirmDialog
          title="Xác nhận xoá thuốc"
          message={
            <>
              Bạn có chắc chắn muốn xoá thuốc <strong>{del.data.name}</strong> ra khỏi danh mục thuốc hoạt động?
              <span className="block text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg mt-3">
                Lưu ý: Hành động này là xoá mềm, các lịch sử kê đơn cũ vẫn giữ nguyên thông tin thuốc này.
              </span>
            </>
          }
          error={deleteError}
          loading={deleting}
          onClose={del.close}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
