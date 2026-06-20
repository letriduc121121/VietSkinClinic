import { useEffect, useState } from 'react';
import { statsApi } from '../api/stats.api';
import type { PatientStats, ServiceStats } from '../types/stats.types';

export function usePatientStats() {
  const [data, setData] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    statsApi.getPatientStats().then(setData).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useServiceStats() {
  const [data, setData] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    statsApi.getServiceStats().then(setData).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
