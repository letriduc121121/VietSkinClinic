import { useEffect, useState } from 'react';
import { userApi } from '../api/user.api';
import { uploadFile } from '@/shared/lib/upload';
import type { UserProfile } from '../types/user.types';

const emptyForm = {
  name: '', email: '', avatar: '',
  dateOfBirth: '', gender: '', address: '', province: '', district: '', ward: '',
  citizenId: '', ethnicity: '', bloodType: '', allergies: '', medicalHistory: '', emergencyContact: '',
};

export type ProfileForm = typeof emptyForm;

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState<number | null>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    userApi.getProfile().then(p => {
      setProfile(p);
      const pp = p.patientProfile;
      setForm({
        name: p.name ?? '', email: p.email ?? '', avatar: p.avatar ?? '',
        dateOfBirth: pp?.dateOfBirth ? pp.dateOfBirth.slice(0, 10) : '',
        gender: pp?.gender ?? '', address: pp?.address ?? '', province: pp?.province ?? '',
        district: pp?.district ?? '', ward: pp?.ward ?? '', citizenId: pp?.citizenId ?? '',
        ethnicity: pp?.ethnicity ?? '', bloodType: pp?.bloodType ?? '', allergies: pp?.allergies ?? '',
        medicalHistory: pp?.medicalHistory ?? '', emergencyContact: pp?.emergencyContact ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setSuccess(''); setError('');
    try {
      await userApi.updateProfile(form);
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(errMsg(e, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setAvatarProgress(0);
    try {
      const url = await uploadFile(file, 'vietskin/avatars', (percent) => setAvatarProgress(percent));
      setForm(f => ({ ...f, avatar: url }));
      await userApi.updateProfile({ avatar: url });
      setSuccess('Cập nhật ảnh đại diện thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Upload ảnh thất bại');
    } finally {
      setAvatarUploading(false);
      setAvatarProgress(null);
    }
  };

  const changePassword = async () => {
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Mật khẩu mới phải ít nhất 6 ký tự'); return; }
    setPwSaving(true);
    try {
      await userApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (e) {
      setPwError(errMsg(e, 'Đổi mật khẩu thất bại'));
    } finally {
      setPwSaving(false);
    }
  };

  return {
    profile, loading, form, setForm, saving, success, error, save,
    avatarUploading, avatarProgress, uploadAvatar,
    pwForm, setPwForm, pwSaving, pwError, pwSuccess, changePassword,
    clearMessages: () => { setSuccess(''); setError(''); },
  };
}
