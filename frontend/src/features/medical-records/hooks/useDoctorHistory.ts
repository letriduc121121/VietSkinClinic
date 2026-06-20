import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { medicalRecordApi } from '../api/medical-record.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { MedicalRecord } from '../types/medical-record.types';

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const firstDayOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export function useDoctorHistory() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(todayISO());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (docId: number, from: string, to: string) => {
    setLoading(true);
    try {
      const data = await appointmentApi.getList({
        doctorId: docId, status: 'done',
        ...(from ? { dateFrom: from } : {}),
        ...(to ? { dateTo: to } : {}),
      });
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const docs = await doctorApi.getAll();
        const me = docs.find((d: any) => (d.user?.id ?? d.userId) === user.id);
        if (me) { setDoctorId(me.id); await load(me.id, dateFrom, dateTo); }
        else setLoading(false);
      } catch { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const applyFilter = () => { if (doctorId) load(doctorId, dateFrom, dateTo); };

  const openDetail = async (id: number) => {
    setDetailLoading(true); setSelected(null); setSelectedRecord(null);
    try {
      const [apt, rec] = await Promise.all([
        appointmentApi.getById(id),
        medicalRecordApi.getByAppointment(id).catch(() => null),
      ]);
      setSelected(apt ?? null);
      setSelectedRecord(rec);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setSelected(null); setSelectedRecord(null); };

  return {
    items, loading, dateFrom, setDateFrom, dateTo, setDateTo, applyFilter,
    selected, selectedRecord, detailLoading, openDetail, closeDetail,
  };
}
