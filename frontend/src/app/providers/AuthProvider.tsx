import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '@/shared/lib/axios';

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: { code: string; name: string };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (u: any): AuthUser => {
    if (!u) return u;
    // Nếu role là string, chuyển thành object { code: string, name: string }
    const role = typeof u.role === 'string'
      ? { code: u.role, name: u.roleName || u.role }
      : u.role;
    return { ...u, role };
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    api.get('/users/profile')
      .then((res) => setUser(normalizeUser(res.data.data)))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (phone: string, password: string) => {
    const { data } = await api.post('/auth/login', { phone, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(normalizeUser(data.data.user));
  };

  const register = async (phone: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', { phone, password, name });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(normalizeUser(data.data.user));
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
