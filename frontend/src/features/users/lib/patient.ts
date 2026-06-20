import type { PatientFormValues } from '../types/user.types';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const genderLabel: Record<string, string> = {
  male: 'Nam', female: 'Nữ', other: 'Khác',
};

export const emptyPatientForm: PatientFormValues = {
  name: '', email: '', dateOfBirth: '', gender: '', bloodType: '',
  ethnicity: '', citizenId: '', emergencyContact: '',
  address: '', ward: '', district: '', province: '',
  allergies: '', medicalHistory: '',
};
