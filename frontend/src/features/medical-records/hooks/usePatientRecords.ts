import { useEffect, useState } from 'react';
import { medicalRecordApi } from '../api/medical-record.api';
import type { MedicalRecord } from '../types/medical-record.types';

export function usePatientRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MedicalRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    medicalRecordApi.getMy()
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      setSelected(await medicalRecordApi.getById(id));
    } finally {
      setDetailLoading(false);
    }
  };

  return { records, loading, selected, detailLoading, loadDetail };
}
