import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { serviceApi } from '@/features/services/api/service.api';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import type { Service } from '@/features/services/types/service.types';
import { appointmentApi } from '../api/appointment.api';
import type { Appointment } from '../types/appointment.types';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export interface BookingAlert { date: string; patientName: string }

export function useReceptionDesk() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO());
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState('');
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [bookingAlert, setBookingAlert] = useState<BookingAlert | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    doctorApi.getAll().then(data => setDoctors(data ?? []));
    serviceApi.getAll().then(data => setServices(data ?? []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (date) params.date = date;
    if (doctorId) params.doctorId = Number(doctorId);
    if (status) params.status = status;
    appointmentApi.getList(params).then(data => setApts(data ?? [])).finally(() => setLoading(false));
  }, [date, doctorId, status]);

  const loadQueue = useCallback(() => {
    appointmentApi.getList({ date: todayISO() })
      .then(all => setQueue((all ?? []).filter(a => ['checked_in', 'in_progress'].includes(a.status))))
      .finally(() => setQueueLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  useSocket(
    (event, data) => {
      if (event === 'appointment_updated') {
        load(); loadQueue();
      } else if (event === 'appointment_created') {
        if (!date || data?.date === date) { load(); loadQueue(); }
        if (data?.date && data?.patientName) {
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          setBookingAlert({ date: data.date, patientName: data.patientName });
          alertTimerRef.current = setTimeout(() => setBookingAlert(null), 8000);
        }
      }
    },
    { topics: ['/topic/appointments'] },
  );

  const confirm = useCallback(async (id: number) => {
    setActioning(id);
    try {
      await appointmentApi.updateStatus(id, 'confirmed');
      setApts(p => p.map(a => (a.id === id ? { ...a, status: 'confirmed' } : a)));
    } finally { setActioning(null); }
  }, []);

  const checkin = useCallback(async (id: number) => {
    setActioning(id);
    try {
      await appointmentApi.updateStatus(id, 'checked_in');
      load(); loadQueue();
    } finally { setActioning(null); }
  }, [load, loadQueue]);

  const cancel = useCallback(async (id: number) => {
    setActioning(id);
    try {
      await appointmentApi.cancel(id);
      setApts(p => p.map(a => (a.id === id ? { ...a, status: 'cancelled' } : a)));
    } finally { setActioning(null); }
  }, []);

  return {
    apts, doctors, services, loading, actioning,
    date, setDate, doctorId, setDoctorId, status, setStatus,
    queue, queueLoading, bookingAlert, dismissAlert: () => setBookingAlert(null),
    reload: load, reloadQueue: loadQueue, confirm, checkin, cancel,
  };
}
