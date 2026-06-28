import { useState } from 'react';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import type { Room } from '@/features/rooms/types/room.types';
import { Hospital } from 'lucide-react';
import { RoomCard } from '@/features/rooms/components/RoomCard';
import { RoomFormDialog } from '@/features/rooms/components/RoomFormDialog';

export default function RoomsPage() {
  const { rooms, doctors, loading, create, update, toggleActive } = useRooms();
  const form = useDisclosure<Room>();
  const offDisc = useDisclosure<Room>();
  const [toggling, setToggling] = useState<number | null>(null);
  const [toggleError, setToggleError] = useState('');

  const assignedDoctorIds = rooms
    .filter(r => r.doctorId != null && r.id !== form.data?.id)
    .map(r => r.doctorId!);

  const doToggle = async (r: Room) => {
    setToggling(r.id); setToggleError('');
    try {
      await toggleActive(r);
    } catch (e: any) {
      setToggleError(e?.response?.data?.message || 'Không thể đổi trạng thái phòng.');
    } finally {
      setToggling(null);
    }
  };

  const requestToggle = (r: Room) => {
    if (r.active) offDisc.openWith(r);
    else doToggle(r);
  };

  const activeCount = rooms.filter(r => r.active).length;
  const inactiveCount = rooms.length - activeCount;

  const addButton = (
    <button onClick={form.open} className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Thêm phòng
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Phòng khám" subtitle="Quản lý phòng khám và phân công bác sĩ phụ trách." actions={addButton} />

      {toggleError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{toggleError}</span>
          <button onClick={() => setToggleError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {!loading && rooms.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-gray-700">{activeCount} đang hoạt động</span>
          </div>
          {inactiveCount > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-400">{inactiveCount} tạm ngừng</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">Đang tải...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="flex justify-center mb-3"><Hospital className="w-12 h-12 text-gray-300" /></div>
          <div className="font-semibold text-gray-600 mb-1">Chưa có phòng nào</div>
          <div className="text-sm text-gray-400 mb-4">Thêm phòng khám đầu tiên để bắt đầu phân công.</div>
          <button onClick={form.open} className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all">Thêm phòng ngay</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map(r => (
            <RoomCard key={r.id} room={r} toggling={toggling === r.id} onEdit={form.openWith} onToggle={requestToggle} />
          ))}
        </div>
      )}

      {form.isOpen && (
        <RoomFormDialog
          target={form.data}
          doctors={doctors}
          assignedDoctorIds={assignedDoctorIds}
          onClose={form.close}
          onCreate={create}
          onUpdate={update}
        />
      )}

      {offDisc.isOpen && offDisc.data && (
        <ConfirmDialog
          title="Tắt phòng khám"
          message={<>Tắt phòng <strong>{offDisc.data.name}</strong>? Phòng sẽ tạm ngừng hoạt động.</>}
          confirmLabel="Tắt phòng"
          loadingLabel="Đang xử lý..."
          loading={toggling === offDisc.data.id}
          onClose={offDisc.close}
          onConfirm={() => { const r = offDisc.data!; offDisc.close(); doToggle(r); }}
        />
      )}
    </div>
  );
}
