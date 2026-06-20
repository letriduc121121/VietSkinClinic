import { useEffect, useState } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { appointmentApi } from '../api/appointment.api';
import type { Appointment } from '../types/appointment.types';

interface LookupResult {
  appointments: Appointment[];
  patient: { id: number; name: string; phone: string } | null;
}

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function useCheckIn() {
  const today = todayISO();
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkedInApt, setCheckedInApt] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const loadQueue = () => {
    appointmentApi.getList({ date: today })
      .then(all => setQueue(all.filter(a => ['checked_in', 'in_progress'].includes(a.status))))
      .finally(() => setQueueLoading(false));
  };

  useEffect(() => { loadQueue(); }, []);

  useSocket(
    event => { if (event === 'appointment_created' || event === 'appointment_updated') loadQueue(); },
    { topics: ['/topic/appointments'] },
  );

  const search = async () => {
    if (!phone.trim()) return;
    setSearching(true); setError(''); setLookupResult(null); setSelectedApt(null); setSuccess(false);
    try {
      const result = await appointmentApi.lookup(phone.trim(), today) as unknown as LookupResult;
      setLookupResult(result);
      const eligible = result.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
      if (eligible.length === 1) setSelectedApt(eligible[0]);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Không tìm thấy lịch hẹn cho số điện thoại này hôm nay');
    } finally {
      setSearching(false);
    }
  };

  const checkin = async () => {
    if (!selectedApt) return;
    setProcessing(true); setError('');
    try {
      await appointmentApi.updateStatus(selectedApt.id, 'checked_in');
      const updated = await appointmentApi.getById(selectedApt.id);
      setCheckedInApt(updated ?? selectedApt);
      setSuccess(true);
      loadQueue();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPhone(''); setLookupResult(null); setSelectedApt(null);
    setSuccess(false); setCheckedInApt(null); setError('');
  };

  return {
    phone, setPhone, searching, lookupResult, selectedApt, setSelectedApt,
    processing, success, checkedInApt, error, search, checkin, reset,
    queue, queueLoading,
  };
}
