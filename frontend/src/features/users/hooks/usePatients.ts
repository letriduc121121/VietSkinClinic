import { useCallback, useEffect, useMemo, useState } from 'react';
import { userApi } from '../api/user.api';
import { authApi } from '@/features/auth/api/auth.api';
import type { PatientFormValues, UserRecord } from '../types/user.types';

const buildProfileBody = (v: PatientFormValues) => ({
  dateOfBirth:      v.dateOfBirth || undefined,
  gender:           v.gender || undefined,
  bloodType:        v.bloodType || undefined,
  ethnicity:        v.ethnicity.trim() || undefined,
  citizenId:        v.citizenId.trim() || undefined,
  emergencyContact: v.emergencyContact.trim() || undefined,
  address:          v.address.trim() || undefined,
  ward:             v.ward.trim() || undefined,
  district:         v.district.trim() || undefined,
  province:         v.province.trim() || undefined,
  allergies:        v.allergies.trim() || undefined,
  medicalHistory:   v.medicalHistory.trim() || undefined,
});

export function usePatients() {
  const [patients, setPatients] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await userApi.getAll();
      setPatients((Array.isArray(raw) ? raw : []).filter(u => u.role?.code === 'patient' && u.active));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const upsert = useCallback((u: UserRecord) =>
    setPatients(prev => prev.map(p => (p.id === u.id ? u : p))), []);

  const getFull = useCallback(async (id: number) => {
    const full = await userApi.getById(id);
    upsert(full);
    return full;
  }, [upsert]);

  const create = useCallback(async (values: PatientFormValues & { phone: string }) => {
    const reg = await authApi.register({
      name: values.name.trim(),
      phone: values.phone.trim(),
      password: values.phone.trim(),
      email: values.email.trim() || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      gender: values.gender ? values.gender as 'male' | 'female' | 'other' : undefined,
      address: values.address.trim() || undefined,
    });
    const body = {
      bloodType:        values.bloodType || undefined,
      ethnicity:        values.ethnicity.trim() || undefined,
      citizenId:        values.citizenId.trim() || undefined,
      emergencyContact: values.emergencyContact.trim() || undefined,
      ward:             values.ward.trim() || undefined,
      district:         values.district.trim() || undefined,
      province:         values.province.trim() || undefined,
      allergies:        values.allergies.trim() || undefined,
      medicalHistory:   values.medicalHistory.trim() || undefined,
    };
    if (Object.values(body).some(x => x !== undefined)) {
      await userApi.update(reg.user.id, body);
    }
    await reload();
  }, [reload]);

  const update = useCallback(async (id: number, values: PatientFormValues) => {
    await userApi.update(id, { name: values.name.trim() || undefined, email: values.email.trim() || undefined, ...buildProfileBody(values) });
    upsert(await userApi.getById(id));
  }, [upsert]);

  const remove = useCallback(async (target: UserRecord) => {
    await userApi.delete(target.id);
    setPatients(prev => prev.filter(u => u.id !== target.id));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.patientProfile?.patientCode?.toLowerCase().includes(q) ?? false),
    );
  }, [patients, search]);

  return { patients: filtered, total: patients.length, loading, search, setSearch, reload, getFull, create, update, remove };
}
