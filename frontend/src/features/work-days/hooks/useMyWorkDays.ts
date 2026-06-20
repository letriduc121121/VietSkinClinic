import { useCallback, useEffect, useState } from 'react';
import { workDayApi } from '../api/work-day.api';
import { monthStr } from '../lib/calendar';

export interface MyWorkDay {
  id: number;
  date: string;
  doctorId: number;
  roomName?: string | null;
}

export function useMyWorkDays() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [workDays, setWorkDays] = useState<MyWorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true); setError('');
    try {
      const data = await workDayApi.getMine(monthStr(y, m)) as unknown as MyWorkDay[];
      setWorkDays(Array.isArray(data) ? data : []);
    } catch {
      setError('Không thể tải lịch làm việc.');
      setWorkDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year, month); }, [year, month, load]);

  const navMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return { year, month, workDays, loading, error, navMonth, goToday, isCurrentMonth };
}
