import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function useUnpaidPayments() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());

  const reload = useCallback(() => {
    setLoading(true);
    appointmentApi.getList({ status: 'done', date })
      .then(data => setApts((data ?? []).filter(a => !a.invoice || a.invoice.status === 'unpaid')))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { reload(); }, [reload]);

  useSocket(
    event => { if (event === 'appointment_updated') reload(); },
    { topics: ['/topic/appointments'] },
  );

  return { apts, loading, date, setDate, reload };
}
