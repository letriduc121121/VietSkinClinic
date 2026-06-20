import { useEffect, useMemo, useState } from 'react';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { workDayApi } from '../api/work-day.api';
import { monthStr } from '../lib/calendar';

export interface ScheduleDoctor {
  id: number;
  specialty: string | null;
  user: { name: string } | null;
  room: { id: number; name: string } | null;
}

export interface ScheduleWorkDay {
  id: number;
  date: string;
  doctorId: number;
  room?: { name?: string };
}

export function useScheduleManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [doctors, setDoctors] = useState<ScheduleDoctor[]>([]);
  const [workDays, setWorkDays] = useState<ScheduleWorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selDoctorId, setSelDoctorId] = useState('');
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const loadWorkDays = async (y: number, m: number) => {
    try {
      const data = await workDayApi.getAll({ month: monthStr(y, m) });
      setWorkDays((Array.isArray(data) ? data : []) as unknown as ScheduleWorkDay[]);
    } catch { /* silent */ }
  };

  useEffect(() => {
    (async () => {
      const docs = await doctorApi.getAll().catch(() => null);
      if (docs) setDoctors((Array.isArray(docs) ? docs : []) as unknown as ScheduleDoctor[]);
      await loadWorkDays(now.getFullYear(), now.getMonth());
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetChanges = () => { setToAdd([]); setToRemove([]); setSaveErr(''); };

  const navMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
    resetChanges();
    loadWorkDays(y, m);
  };

  const selectDoctor = (id: string) => { setSelDoctorId(id); resetChanges(); };

  const selDoctor = useMemo(
    () => (selDoctorId ? doctors.find(d => d.id === Number(selDoctorId)) ?? null : null),
    [selDoctorId, doctors],
  );
  const selDocWorkDays = useMemo(
    () => (selDoctorId ? workDays.filter(wd => wd.doctorId === Number(selDoctorId)) : []),
    [selDoctorId, workDays],
  );
  const savedDatesMap = useMemo(
    () => new Map(selDocWorkDays.map(wd => [wd.date.split('T')[0], wd])),
    [selDocWorkDays],
  );
  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const toggle = (iso: string) => {
    if (!selDoctorId) return;
    if (savedDatesMap.has(iso)) {
      setToRemove(prev => (prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]));
    } else {
      setToAdd(prev => (prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]));
    }
  };

  const save = async (): Promise<string | null> => {
    if (!selDoctorId || !hasChanges) return null;
    setSaving(true); setSaveErr('');
    try {
      for (const dateStr of toRemove) {
        const wd = savedDatesMap.get(dateStr);
        if (wd) await workDayApi.delete(wd.id);
      }
      if (toAdd.length === 1) {
        await workDayApi.create({ doctorId: Number(selDoctorId), date: toAdd[0] });
      } else if (toAdd.length > 1) {
        await workDayApi.bulkCreate({ doctorId: Number(selDoctorId), dates: toAdd });
      }
      const parts: string[] = [];
      if (toAdd.length > 0) parts.push(`thêm ${toAdd.length} ngày`);
      if (toRemove.length > 0) parts.push(`xóa ${toRemove.length} ngày`);
      resetChanges();
      await loadWorkDays(year, month);
      return `Đã ${parts.join(' và ')}`;
    } catch (e: any) {
      setSaveErr(e?.response?.data?.message ?? 'Không thể lưu lịch.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    year, month, doctors, loading, selDoctorId, selectDoctor,
    selDoctor, selDocWorkDays, savedDatesMap, toAdd, toRemove, hasChanges,
    saving, saveErr, navMonth, toggle, save,
  };
}
