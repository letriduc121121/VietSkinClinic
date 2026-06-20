import { useEffect, useState } from 'react';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { serviceApi } from '@/features/services/api/service.api';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import type { Service } from '@/features/services/types/service.types';

export function useLandingData() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    doctorApi.getAll().then(data => setDoctors(Array.isArray(data) ? data : [])).catch(() => {});
    serviceApi.getAll().then(data => setServices(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  return { doctors, services, doctorCount: doctors.length };
}
