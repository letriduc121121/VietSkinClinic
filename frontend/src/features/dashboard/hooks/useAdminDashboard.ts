import { useEffect, useState } from 'react';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { invoiceApi } from '@/features/invoices/api/invoice.api';
import { statsApi } from '@/features/stats/api/stats.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { PatientStats } from '@/features/stats/types/stats.types';
import type { InvoiceStats } from '@/features/invoices/types/invoice.types';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

export function useAdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [apptRes, pRes, rRes] = await Promise.allSettled([
        appointmentApi.getList({ date: todayISO() }),
        statsApi.getPatientStats(),
        invoiceApi.getStats(),
      ]);
      if (apptRes.status === 'fulfilled' && Array.isArray(apptRes.value)) setAppointments(apptRes.value);
      if (pRes.status === 'fulfilled') setPatientStats(pRes.value);
      if (rRes.status === 'fulfilled') setRevenueStats(rRes.value);
      setLoading(false);
    })();
  }, []);

  return { appointments, patientStats, revenueStats, loading };
}
