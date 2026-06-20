import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

export function useDoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const docs = await doctorApi.getAll();
        const me = docs.find((d: any) => (d.user?.id ?? d.userId) === user.id);
        if (me) {
          const data = await appointmentApi.getList({ date: todayISO(), doctorId: me.id });
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [user?.id]);

  return { appointments, loading };
}
