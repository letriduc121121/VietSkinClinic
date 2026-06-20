import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Alert } from '@/shared/components/Alert';
import { AuthShell } from '@/features/auth/components/AuthShell';

const roleRedirect: Record<string, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  receptionist: '/receptionist/dashboard',
  admin: '/admin/dashboard',
};

const FEATURES = [
  { icon: 'calendar', text: 'Đặt lịch & quản lý lịch hẹn' },
  { icon: 'record', text: 'Bệnh án & đơn thuốc điện tử' },
  { icon: 'chat', text: 'Trợ lý AI tư vấn da liễu 24/7' },
  { icon: 'notify', text: 'Thông báo nhắc nhở realtime' },
];

const inputCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate(roleRedirect[user.role.code] || '/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(phone, password);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Số điện thoại hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <AuthShell
      heading={<>Hệ thống quản lý<br />phòng khám da liễu</>}
      subtitle="Nền tảng số hóa toàn bộ quy trình khám chữa bệnh, từ đặt lịch đến bệnh án điện tử."
      features={FEATURES}
      formTitle="Đăng nhập"
      formSubtitle="Nhập số điện thoại và mật khẩu để tiếp tục"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xx xxx xxx" required autoFocus className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className={`${inputCls} pr-11`} />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              {showPass ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
        </div>

        {error && <Alert variant="error" className="px-3 rounded-lg">{error}</Alert>}

        <button type="submit" disabled={loading} className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0f2540] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          )}
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
        Chưa có tài khoản? <Link to="/register" className="text-[#1a3a5c] font-semibold hover:underline">Đăng ký bệnh nhân</Link>
      </div>
    </AuthShell>
  );
}
