import { useCallback, useEffect, useState } from 'react';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { medicineApi } from '@/features/medicines/api/medicine.api';
import { prescriptionApi } from '@/features/prescriptions/api/prescription.api';
import { medicalRecordImageApi } from '@/features/medical-record-images/api/medical-record-image.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { Medicine } from '@/features/medicines/types/medicine.types';
import type { MedicalRecord } from '@/features/medical-records/types/medical-record.types';
import type { MedicalRecordImage } from '@/features/medical-record-images/types/medical-record-image.types';
import { medicalRecordApi } from '../api/medical-record.api';
import type { PresItem, SavedPrescription } from '../lib/exam';

export interface HistoryRecord {
  id: number;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  createdAt: string;
  appointment: { date: string; service: { name: string } | null } | null;
}

const emptyRecForm = { symptoms: '', diagnosis: '', skinType: '', lesionLocation: '', treatment: '', note: '', followUpDate: '' };

export function useExamine(appointmentId?: string) {
  const [apt, setApt] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [recForm, setRecForm] = useState(emptyRecForm);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [presItems, setPresItems] = useState<PresItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [presNote, setPresNote] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [savingPres, setSavingPres] = useState(false);
  const [openPres, setOpenPres] = useState(false);

  const [images, setImages] = useState<MedicalRecordImage[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      try {
        const [a, meds, r] = await Promise.all([
          appointmentApi.getById(Number(appointmentId)),
          medicineApi.getAll(),
          medicalRecordApi.getByAppointment(Number(appointmentId)).catch(() => null),
        ]);
        setApt(a);
        setMedicines(meds ?? []);
        setRecForm(f => ({ ...f, symptoms: a.symptoms ?? '' }));

        if (r) {
          setRecord(r);
          setHasFollowUp(!!r.followUpDate);
          setRecForm({
            symptoms: r.symptoms ?? a.symptoms ?? '',
            diagnosis: r.diagnosis ?? '',
            skinType: r.skinType ?? '',
            lesionLocation: r.lesionLocation ?? '',
            treatment: r.treatment ?? '',
            note: r.note ?? '',
            followUpDate: r.followUpDate ? r.followUpDate.split('T')[0] : '',
          });
          if (r.prescriptions && r.prescriptions.length > 0) {
            setPrescriptions(r.prescriptions.map((p) => ({
              id: p.id,
              note: p.note ?? '',
              items: (p.items ?? []).map((it) => ({
                medicineName: it.medicineName,
                dosage: it.dosage ?? '',
                frequency: it.frequency ?? '',
                duration: it.duration ?? '',
                quantity: it.quantity ?? 1,
                note: it.note ?? '',
              })),
            })));
            setOpenPres(true);
          }
          setImages(Array.isArray(r.images) ? r.images : []);
        }

        if (a.patientId) {
          try {
            const hData = await medicalRecordApi.getByPatient(a.patientId);
            setHistory(
              (Array.isArray(hData) ? hData : [])
                .filter((h) => h.id !== r?.id)
                .map((h) => ({
                  id: h.id,
                  symptoms: h.symptoms ?? null,
                  diagnosis: h.diagnosis ?? null,
                  treatment: h.treatment ?? null,
                  createdAt: h.createdAt,
                  appointment: h.appointment
                    ? { date: h.appointment.date, service: h.appointment.service ?? null }
                    : null,
                })),
            );
          } catch { /* no history */ }
        }
      } catch {
        setError('Không thể tải dữ liệu.');
      }
      setLoading(false);
    })();
  }, [appointmentId]);

  const saveRecord = useCallback(async (): Promise<number | null> => {
    if (!apt) return null;
    setSaving(true);
    try {
      const payload = {
        appointmentId: apt.id,
        symptoms: recForm.symptoms || undefined,
        diagnosis: recForm.diagnosis || undefined,
        skinType: recForm.skinType || undefined,
        lesionLocation: recForm.lesionLocation || undefined,
        treatment: recForm.treatment || undefined,
        note: recForm.note || undefined,
        followUpDate: hasFollowUp && recForm.followUpDate ? recForm.followUpDate : undefined,
      };
      if (record?.id) {
        await medicalRecordApi.update(record.id, payload);
        flash('Đã cập nhật hồ sơ!');
        return record.id;
      }
      const r = await medicalRecordApi.create(payload);
      setRecord(r);
      flash('Đã lưu hồ sơ!');
      return r.id;
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi lưu hồ sơ.');
      return null;
    } finally {
      setSaving(false);
    }
  }, [apt, recForm, record, hasFollowUp]);

  const savePrescription = async () => {
    if (!apt || presItems.length === 0) { setError('Thêm ít nhất 1 thuốc.'); return; }
    setSavingPres(true);
    try {
      const recId = record?.id ?? await saveRecord();
      const result = await prescriptionApi.create({
        appointmentId: apt.id,
        medicalRecordId: recId ?? undefined,
        note: presNote || undefined,
        items: presItems.map(i => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          dosage: i.dosage || undefined,
          frequency: i.frequency || undefined,
          duration: i.duration || undefined,
          quantity: i.quantity || undefined,
          note: i.note || undefined,
        })),
      } as any);
      setPrescriptions(prev => [...prev, { id: result.id, note: presNote, items: [...presItems] }]);
      setPresItems([]); setPresNote('');
      flash('Đã lưu đơn thuốc!');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi lưu toa thuốc.');
    } finally {
      setSavingPres(false);
    }
  };

  const deletePrescription = async (id: number) => {
    try {
      await prescriptionApi.delete(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      flash('Đã xóa đơn thuốc thành công!');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa đơn thuốc.');
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let recId = record?.id;
    if (!recId) {
      recId = (await saveRecord()) ?? undefined;
      if (!recId) return;
    }
    const uploads = Array.from(files).slice(0, 10);
    const progressArr = new Array(uploads.length).fill(0);
    setUploadProgress(0);
    setUploadingImg(true);
    try {
      const results = await Promise.allSettled(
        uploads.map((f, i) => 
          medicalRecordImageApi.upload(recId!, f, undefined, (percent) => {
            progressArr[i] = percent;
            setUploadProgress(Math.round(progressArr.reduce((a, b) => a + b, 0) / uploads.length));
          })
        )
      );
      const newImgs = results
        .filter((r): r is PromiseFulfilledResult<MedicalRecordImage> => r.status === 'fulfilled')
        .map(r => r.value);
      setImages(prev => [...prev, ...newImgs]);
      if (newImgs.length > 0) flash(`Đã tải lên ${newImgs.length} ảnh!`);
    } catch {
      setError('Không thể tải ảnh lên.');
    } finally {
      setUploadingImg(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (img: MedicalRecordImage) => {
    try {
      await medicalRecordImageApi.delete(img.id);
      setImages(prev => prev.filter(i => i.id !== img.id));
    } catch {
      setError('Không thể xoá ảnh.');
    }
  };

  const finish = async (): Promise<boolean> => {
    if (!apt) return false;
    setFinishing(true);
    try {
      if (!record?.id) await saveRecord();
      await appointmentApi.updateStatus(apt.id, 'done');
      return true;
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi hoàn tất khám.');
      return false;
    } finally {
      setFinishing(false);
    }
  };

  const addMed = (m: Medicine) => {
    if (presItems.some(i => i.medicineId === m.id)) return;
    setPresItems(p => [...p, { medicineId: m.id, medicineName: m.name, dosage: '', frequency: '', duration: '', quantity: 1, note: '' }]);
    setMedSearch('');
  };
  const updatePres = (idx: number, k: keyof PresItem, v: string | number) =>
    setPresItems(p => p.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  const removePres = (i: number) => setPresItems(p => p.filter((_, idx) => idx !== i));

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).slice(0, 8);

  return {
    apt, history, loading, saving, finishing, success, error, setError,
    record, hasFollowUp, setHasFollowUp, recForm, setRecForm,
    presItems, prescriptions, presNote, setPresNote, medSearch, setMedSearch, savingPres,
    openPres, setOpenPres, filteredMeds, addMed, updatePres, removePres,
    images, uploadingImg, uploadProgress, uploadImages, deleteImage,
    saveRecord, savePrescription, deletePrescription, finish,
  };
}
