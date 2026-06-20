import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useSocket } from '@/shared/hooks/useSocket';
import { appointmentApi } from '../api/appointment.api';
import type { Appointment } from '../types/appointment.types';

export function usePatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    appointmentApi.getMy()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useSocket(
    (event, data) => {
      if (event === 'appointment_updated') {
        setAppointments(prev => prev.map(a => a.id === data.appointmentId
          ? { ...a, status: data.status, queueNumber: data.queueNumber ?? a.queueNumber }
          : a));
      }
    },
    { topics: user?.id ? [`/topic/patient/${user.id}`] : [], enabled: !!user?.id },
  );

  const cancel = useCallback(async (id: number) => {
    await appointmentApi.cancel(id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  }, []);

  return { appointments, loading, cancel };
}
