import { useEffect, useState } from 'react';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { invoiceApi } from '@/features/invoices/api/invoice.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { Invoice } from '@/features/invoices/types/invoice.types';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function useReceptionistDashboard() {
  const today = todayISO();
  const [apts, setApts] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([appointmentApi.getList({ date: today }), invoiceApi.getAll({ date: today })])
      .then(([a, inv]) => { setApts(a); setInvoices(inv); })
      .finally(() => setLoading(false));
  }, [today]);

  const confirm = async (id: number) => {
    setConfirming(id);
    try {
      await appointmentApi.updateStatus(id, 'confirmed');
      setApts(prev => prev.map(a => (a.id === id ? { ...a, status: 'confirmed' } : a)));
    } finally {
      setConfirming(null);
    }
  };

  return { apts, invoices, loading, confirming, confirm, today };
}
