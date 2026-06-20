export const fmtExamDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
export const calcAge = (dob: string) => new Date().getFullYear() - new Date(dob).getFullYear();
export const genderLabel = (g: string | null) => (g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : g ?? '–');
export const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

export interface PresItem {
  medicineId?: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  note: string;
}

export interface SavedPrescription { id: number; note?: string | null; items: PresItem[] }

export const formatInstruction = (dosage?: string | null, frequency?: string | null, duration?: string | null) => {
  const parts: string[] = [];
  if (dosage) {
    const d = dosage.trim();
    parts.push(d.match(/^\d+(\.\d+)?$/) ? `Uống/Dùng: ${d} viên` : d);
  }
  if (frequency) {
    const f = frequency.trim();
    parts.push(f.match(/^\d+$/) ? `ngày ${f} lần` : f);
  }
  if (duration) {
    const dur = duration.trim();
    parts.push(dur.match(/^\d+$/) ? `trong ${dur} ngày` : dur);
  }
  return parts.filter(Boolean).join(', ');
};
