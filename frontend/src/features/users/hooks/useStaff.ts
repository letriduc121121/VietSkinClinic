import { useCallback, useEffect, useState } from 'react';
import { userApi } from '../api/user.api';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { resolveCustom } from '../lib/staff';
import type { DoctorProfile, StaffCreateForm, StaffEditForm, UserRecord } from '../types/user.types';

interface Specialty { id: number; name: string; description?: string | null }
interface Degree { id: number; name: string }

export function useStaff() {
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, doctorsRes] = await Promise.allSettled([userApi.getAll(), doctorApi.getAll()]);

      let users: UserRecord[] = [];
      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value ?? [];
        users = (Array.isArray(raw) ? raw : []).filter(
          u => ['doctor', 'receptionist', 'admin'].includes(u.role?.code) && u.active,
        );
      }
      if (doctorsRes.status === 'fulfilled') {
        const docMap = new Map<number, DoctorProfile>();
        (Array.isArray(doctorsRes.value) ? doctorsRes.value : []).forEach((d: any) => {
          const uid: number = d.userId ?? d.user?.id;
          if (uid) docMap.set(uid, d);
        });
        users = users.map(u => ({
          ...u,
          doctorProfile: u.role?.code === 'doctor' ? (docMap.get(u.id) ?? null) : null,
        }));
      }
      setStaff(users);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [sp, dg] = await Promise.all([doctorApi.getSpecialties(), doctorApi.getDegrees()]);
      setSpecialties(Array.isArray(sp) ? sp : []);
      setDegrees(Array.isArray(dg) ? dg : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { reload(); loadLookups(); }, [reload, loadLookups]);

  const create = useCallback(async (form: StaffCreateForm) => {
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      password: form.password,
      roleCode: form.roleCode,
      avatar: form.avatar || undefined,
    };
    if (form.roleCode === 'doctor') {
      const specialty = resolveCustom(form.specialty, form.specialtyCustom);
      const degree = resolveCustom(form.degree, form.degreeCustom);
      if (specialty) body.specialty = specialty;
      if (degree) body.degree = degree;
      if (form.experience) body.experience = form.experience;
      if (form.consultationFee) body.consultationFee = Number(form.consultationFee);
      if (form.description) body.description = form.description;
    }
    await userApi.createStaff(body as any);
    await reload();
  }, [reload]);

  const update = useCallback(async (target: UserRecord, form: StaffEditForm) => {
    const userPatch: Record<string, unknown> = {};
    if (form.name.trim() && form.name.trim() !== target.name) userPatch.name = form.name.trim();
    if (form.email.trim() !== (target.email ?? '')) userPatch.email = form.email.trim() || null;
    if (form.avatar !== (target.avatar ?? '')) userPatch.avatar = form.avatar || null;
    if (Object.keys(userPatch).length > 0) await userApi.update(target.id, userPatch);

    if (target.doctorProfile) {
      const body: Record<string, unknown> = {
        specialty:       resolveCustom(form.specialty, form.specialtyCustom) || undefined,
        degree:          resolveCustom(form.degree, form.degreeCustom) || undefined,
        experience:      form.experience || undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        description:     form.description || undefined,
      };
      await doctorApi.update(target.doctorProfile.id, body as any);
    }
    await reload();
  }, [reload]);

  const remove = useCallback(async (target: UserRecord) => {
    await userApi.delete(target.id);
    setStaff(prev => prev.filter(u => u.id !== target.id));
  }, []);

  return { staff, loading, specialties, degrees, reload, create, update, remove };
}
