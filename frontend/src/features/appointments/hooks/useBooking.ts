import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { serviceApi } from '@/features/services/api/service.api';
import type { Doctor, DoctorSlotData } from '@/features/doctors/types/doctor.types';
import type { Service } from '@/features/services/types/service.types';
import { appointmentApi } from '../api/appointment.api';

/** Thông tin chọn sẵn khi vào trang đặt lịch từ chatbot (deep-link). */
export interface BookingInit {
  doctorId?: number;
  date?: string;
  time?: string;
}

export function useBooking(initial?: BookingInit) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotData, setSlotData] = useState<DoctorSlotData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [form, setForm] = useState({ symptoms: '', serviceId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Khung giờ chờ áp dụng từ deep-link — gán sau khi slot của ngày đó tải xong.
  const pendingSlot = useRef<string | null>(initial?.time ?? null);
  const appliedInit = useRef(false);

  useEffect(() => {
    doctorApi.getAll().then(setDoctors).catch(() => {});
    serviceApi.getAll().then(setServices).catch(() => {});
  }, []);

  // Chọn sẵn bác sĩ (và ngày) khi mở trang từ chatbot.
  useEffect(() => {
    if (appliedInit.current || !initial?.doctorId || doctors.length === 0) return;
    const doc = doctors.find((d) => d.id === initial.doctorId);
    if (!doc) return;
    appliedInit.current = true;
    setSelectedDoctor(doc);
    if (initial.date) setSelectedDate(initial.date);
  }, [doctors, initial]);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setSlotData(null); setSelectedSlot('');
    setSlotLoading(true);
    doctorApi.getSlots(selectedDoctor.id, selectedDate)
      .then((data) => {
        setSlotData(data);
        if (pendingSlot.current) {
          const match = data.slots.find((s) => s.time === pendingSlot.current && s.available);
          if (match) setSelectedSlot(pendingSlot.current);
          pendingSlot.current = null;
        }
      })
      .finally(() => setSlotLoading(false));
  }, [selectedDoctor, selectedDate]);

  const selectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc); setSelectedDate(''); setSlotData(null); setSelectedSlot('');
  };

  const submit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    setLoading(true); setError('');
    try {
      await appointmentApi.create({
        patientName: user!.name,
        patientPhone: user!.phone,
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedSlot,
        symptoms: form.symptoms || undefined,
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đặt lịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSubmitted(false); setSelectedDoctor(null); setSelectedDate('');
    setSlotData(null); setSelectedSlot(''); setForm({ symptoms: '', serviceId: '' }); setError('');
  };

  return {
    doctors, services, selectedDoctor, selectDoctor,
    selectedDate, setSelectedDate, slotData, slotLoading, selectedSlot, setSelectedSlot,
    form, setForm, loading, error, submitted, submit, reset,
  };
}
