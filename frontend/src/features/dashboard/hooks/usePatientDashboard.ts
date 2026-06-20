import { useEffect, useState } from 'react';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { medicalRecordApi } from '@/features/medical-records/api/medical-record.api';
import { notificationApi } from '@/features/notifications/api/notification.api';
import { userApi } from '@/features/users/api/user.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { MedicalRecord } from '@/features/medical-records/types/medical-record.types';

export interface DashboardNotification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

interface ProfileData {
  patientProfile: { bloodType: string | null; allergies: string | null } | null;
}

export function usePatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      const [apptRes, recRes, notifRes, profRes] = await Promise.allSettled([
        appointmentApi.getMy(),
        medicalRecordApi.getMy(),
        notificationApi.getAll(),
        userApi.getProfile(),
      ]);
      if (apptRes.status === 'fulfilled') setAppointments(Array.isArray(apptRes.value) ? apptRes.value : []);
      if (recRes.status === 'fulfilled') setRecords(Array.isArray(recRes.value) ? recRes.value : []);
      if (notifRes.status === 'fulfilled') setNotifications(Array.isArray(notifRes.value) ? (notifRes.value as unknown as DashboardNotification[]).slice(0, 5) : []);
      if (profRes.status === 'fulfilled') setProfile(profRes.value as unknown as ProfileData);
      setLoading(false);
    })();
  }, []);

  const cancel = async (id: number) => {
    setCancelling(true);
    try {
      await appointmentApi.cancel(id);
      const data = await appointmentApi.getMy();
      setAppointments(Array.isArray(data) ? data : []);
    } finally {
      setCancelling(false);
    }
  };

  return { appointments, records, notifications, profile, loading, cancelling, cancel };
}
