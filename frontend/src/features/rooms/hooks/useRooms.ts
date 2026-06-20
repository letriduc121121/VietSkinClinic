import { useCallback, useEffect, useState } from 'react';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import { roomApi } from '../api/room.api';
import type { Room, RoomForm } from '../types/room.types';

const buildPayload = (f: RoomForm) => ({
  name: f.name,
  doctorId: f.doctorId ? Number(f.doctorId) : null,
});

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [roomData, docData] = await Promise.all([roomApi.getAll(), doctorApi.getAll()]);
      setRooms(Array.isArray(roomData) ? roomData : []);
      setDoctors(Array.isArray(docData) ? docData : []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const create = useCallback(async (form: RoomForm) => {
    await roomApi.create(buildPayload(form) as any);
    await reload();
  }, [reload]);

  const update = useCallback(async (id: number, form: RoomForm) => {
    await roomApi.update(id, buildPayload(form) as any);
    await reload();
  }, [reload]);

  const toggleActive = useCallback(async (room: Room) => {
    const updated = await roomApi.toggleActive(room.id);
    setRooms(prev => prev.map(x => (x.id === room.id ? { ...x, active: updated.active } : x)));
  }, []);

  return { rooms, doctors, loading, reload, create, update, toggleActive };
}
