import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { appointmentApi } from '../api/appointment.api';
import type { Appointment } from '../types/appointment.types';

export interface ConfirmedEntry { id: number; name: string; time: string; date: string; doctor: string }

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const sortByNearest = (a: Appointment, b: Appointment) =>
  (a.date.slice(0, 10) + 'T' + a.time).localeCompare(b.date.slice(0, 10) + 'T' + b.time);

const toEntry = (a: Appointment): ConfirmedEntry => ({
  id: a.id, name: a.patientName, time: a.time, date: a.date, doctor: a.doctor.user.name,
});

export function usePendingApprovals() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [recentConfirmed, setRecentConfirmed] = useState<ConfirmedEntry[]>([]);

  const reload = useCallback(() => {
    setLoading(true);
    appointmentApi.getList({ status: 'pending', dateFrom: todayISO() })
      .then(data => setApts((data ?? []).sort(sortByNearest)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useSocket(
    event => { if (event === 'appointment_created' || event === 'appointment_updated') reload(); },
    { topics: ['/topic/appointments'] },
  );

  const confirm = useCallback(async (apt: Appointment) => {
    setActioning(apt.id);
    try {
      await appointmentApi.updateStatus(apt.id, 'confirmed');
      setApts(p => p.filter(a => a.id !== apt.id));
      setRecentConfirmed(prev => [toEntry(apt), ...prev].slice(0, 10));
    } finally { setActioning(null); }
  }, []);

  const reject = useCallback(async (id: number) => {
    setActioning(id);
    try {
      await appointmentApi.cancel(id);
      setApts(p => p.filter(a => a.id !== id));
    } finally { setActioning(null); }
  }, []);

  const confirmAll = useCallback(async (list: Appointment[]) => {
    setActioning(-1);
    try {
      await Promise.all(list.map(a => appointmentApi.updateStatus(a.id, 'confirmed')));
      setRecentConfirmed(prev => [...list.map(toEntry), ...prev].slice(0, 10));
      setApts(p => p.filter(a => !list.find(d => d.id === a.id)));
    } finally { setActioning(null); }
  }, []);

  return { apts, loading, actioning, recentConfirmed, reload, confirm, reject, confirmAll };
}
