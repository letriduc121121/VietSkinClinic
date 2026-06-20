import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useSocket } from '@/shared/hooks/useSocket';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { appointmentApi } from '../api/appointment.api';

export interface QueueItem {
  id: number;
  queueNumber: number | null;
  patientName: string;
  patientPhone: string | null;
  time: string;
  status: 'checked_in' | 'in_progress' | 'done';
  symptoms: string | null;
  service: { name: string } | null;
  patient: {
    name: string;
    phone: string;
    patientProfile: {
      patientCode: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      province: string | null;
      address: string | null;
    } | null;
  } | null;
}

const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

export function useDoctorQueue() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (docId: number) => {
    try {
      const [queue, schedule] = await Promise.all([
        appointmentApi.getQueue(docId, todayStr()),
        appointmentApi.getSchedule(docId, todayStr()),
      ]);
      const done = schedule.filter((a: any) => a.status === 'done');
      const inProgress = queue.filter((a: any) => a.status === 'in_progress');
      const waiting = queue.filter((a: any) => a.status === 'checked_in');
      setItems([...waiting, ...inProgress, ...done] as QueueItem[]);
      setError('');
    } catch {
      setError('Không thể tải danh sách.');
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const docs = await doctorApi.getAll();
        const me = docs.find((d: any) => d.user.id === user.id);
        if (me) { setDoctorId(me.id); await load(me.id); }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [user?.id, load]);

  useSocket(
    event => { if (event === 'queue_updated' && doctorId) load(doctorId); },
    { topics: doctorId ? [`/topic/doctor/${doctorId}`] : [], enabled: !!doctorId },
  );

  const promote = useCallback(async (id: number) => {
    setCalling(id);
    try {
      await appointmentApi.updateStatus(id, 'in_progress');
      return true;
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi khi gọi bệnh nhân.');
      if (doctorId) load(doctorId);
      return false;
    } finally {
      setCalling(null);
    }
  }, [doctorId, load]);

  return { items, loading, calling, error, promote };
}
