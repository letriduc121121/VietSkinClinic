import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { Bell, Clock, Pill, Calendar, Hospital } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import ExamToast from '@/features/notifications/components/ExamToast';
import { notificationApi, type Notification } from '@/features/notifications/api/notification.api';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { useSocket } from '@/shared/hooks/useSocket';

interface MenuItem { path: string; label: string; icon: React.ReactElement }

const Icon = {
  dashboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  calendar:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  users:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  user:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  clipboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  receipt:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>,
  medicine:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  test:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  service:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  room:      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  checkin:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  booking:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  chart:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
};

const menuByRole: Record<string, MenuItem[]> = {
  patient: [
    { path: '/patient/dashboard',    label: 'Tổng quan',          icon: Icon.dashboard },
    { path: '/patient/booking',      label: 'Đặt lịch khám',      icon: Icon.booking   },
    { path: '/patient/appointments', label: 'Lịch hẹn của tôi',   icon: Icon.calendar  },
    { path: '/patient/records',      label: 'Lịch sử khám',      icon: Icon.clipboard },
    { path: '/patient/invoices',     label: 'Lịch sử thanh toán', icon: Icon.receipt   },
    { path: '/patient/profile',      label: 'Thông tin cá nhân',  icon: Icon.user      },
  ],
  receptionist: [
    { path: '/receptionist/dashboard',    label: 'Tổng quan',           icon: Icon.dashboard },
    { path: '/receptionist/appointments', label: 'Quản lý lịch hẹn',   icon: Icon.calendar  },
    { path: '/receptionist/confirm',      label: 'Duyệt lịch hẹn',     icon: Icon.checkin   },
    { path: '/receptionist/billing',      label: 'Thu tiền',            icon: Icon.receipt   },
    { path: '/receptionist/patients',      label: 'Hồ sơ bệnh nhân',     icon: Icon.user      },
    { path: '/receptionist/profile',      label: 'Thông tin cá nhân',   icon: Icon.user      },
  ],
  doctor: [
    { path: '/doctor/dashboard',     label: 'Tổng quan',         icon: Icon.dashboard },
    { path: '/doctor/today',         label: 'Lịch khám hôm nay', icon: Icon.calendar  },
    { path: '/doctor/work-schedule', label: 'Lịch làm việc',     icon: Icon.calendar  },
    { path: '/doctor/history',       label: 'Lịch sử ca khám',   icon: Icon.clipboard },
    { path: '/doctor/profile',   label: 'Thông tin cá nhân', icon: Icon.user      },
  ],
  admin: [
    { path: '/admin/dashboard',     label: 'Tổng quan',             icon: Icon.dashboard },
    { path: '/admin/stats',         label: 'Thống kê',              icon: Icon.chart     },
    { path: '/admin/staff',         label: 'Quản lý nhân sự',       icon: Icon.users     },
    { path: '/admin/patients',      label: 'Hồ sơ bệnh nhân',      icon: Icon.user      },
    { path: '/admin/services',      label: 'Dịch vụ & Giá',         icon: Icon.service   },
    { path: '/admin/medicines',     label: 'Danh mục thuốc',        icon: Icon.medicine  },
    { path: '/admin/schedule',      label: 'Lịch làm việc',         icon: Icon.calendar  },
    { path: '/admin/rooms',         label: 'Phòng khám',             icon: Icon.room      },
  ],
};

const roleLabel: Record<string, string> = {
  patient:      'Bệnh nhân',
  receptionist: 'Lễ tân',
  doctor:       'Bác sĩ',
  admin:        'Quản trị viên',
};

const fmtTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const typeIcon: Record<string, React.ReactNode> = {
  appointment: <Calendar className="w-5 h-5" />,
  reminder:    <Clock className="w-5 h-5" />,
  prescription:<Pill className="w-5 h-5" />,
  system:      <Bell className="w-5 h-5" />,
};

// ── Chuông thông báo cho Lễ tân (local state, không cần DB) ─────────────────
interface LocalNotif {
  id: number;
  message: string;
  sub: string;
  time: string;
  read: boolean;
}

function ReceptionistNotificationBell() {
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState<LocalNotif[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Lắng nghe WebSocket topic của lễ tân
  useSocket(
    (event, payload: any) => {
      // Bệnh nhân vừa đặt lịch mới
      if (event === 'appointment_created') {
        const name = payload?.patientName ?? 'Bệnh nhân';
        const date = payload?.date
          ? payload.date.split('-').reverse().join('/')
          : '';
        setNotifs(prev => [{
          id:      nextId.current++,
          message: `${name} vừa đặt lịch khám`,
          sub:     date ? `Ngày ${date} — chờ xác nhận` : 'Chờ xác nhận',
          time:    new Date().toISOString(),
          read:    false,
        }, ...prev]);
      }

      // Lịch hẹn quá hạn tự động đánh dấu không đến
      if (event === 'appointment_updated' && payload?.status === 'no_show') {
        const name = payload.patientName ?? `#${payload.appointmentId}`;
        const date = payload.date
          ? payload.date.split('-').reverse().join('/')
          : '';
        const time = payload.time ? ` lúc ${payload.time}` : '';
        setNotifs(prev => [{
          id:      nextId.current++,
          message: `${name} không đến khám`,
          sub:     `Ngày ${date}${time} — đã tự động đánh dấu không đến`,
          time:    new Date().toISOString(),
          read:    false,
        }, ...prev]);
      }
    },
    { topics: ['/topic/appointments'] },
  );

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(v => !v);
    // Đánh dấu tất cả đã đọc khi mở
    if (!open && unread > 0) {
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleClear = () => { setNotifs([]); setOpen(false); };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        title="Thông báo lịch hẹn"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-sm text-gray-900">Thông báo lịch hẹn</span>
            {notifs.length > 0 && (
              <button onClick={handleClear} className="text-xs text-red-500 font-medium hover:underline">
                Xóa tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <div className="flex justify-center mb-2"><Bell className="w-8 h-8 text-gray-300" /></div>
                Chưa có thông báo
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 ${n.read ? 'bg-white' : 'bg-orange-50/60'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-snug ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {n.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.sub}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{fmtTimeAgo(n.time)}</div>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chuông thông báo cho Bác sĩ (local state, WebSocket) ────────────────────
function DoctorNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctorId,  setDoctorId]  = useState<number | null>(null);
  const [open,      setOpen]      = useState(false);
  const [notifs,    setNotifs]    = useState<LocalNotif[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Lấy doctorId từ userId (cần 1 lần khi mount)
  useEffect(() => {
    if (!user?.id) return;
    doctorApi.getAll().then((docs: any[]) => {
      const me = docs.find((d: any) => (d.user?.id ?? d.userId) === user.id);
      if (me) setDoctorId(me.id);
    }).catch(() => {});
  }, [user?.id]);

  // Lắng nghe queue_updated trên topic của bác sĩ này
  useSocket(
    (_event, _payload: any) => {
      // Mỗi lần hàng chờ thay đổi (check-in mới) → hiện thông báo
      setNotifs(prev => [{
        id:      nextId.current++,
        message: 'Có bệnh nhân trong hàng chờ',
        sub:     'Vừa có bệnh nhân check-in. Vui lòng kiểm tra lịch khám.',
        time:    new Date().toISOString(),
        read:    false,
      }, ...prev]);
    },
    { topics: doctorId ? [`/topic/doctor/${doctorId}`] : [], enabled: !!doctorId },
  );

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unread > 0)
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClear = () => { setNotifs([]); setOpen(false); };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        title="Hàng chờ khám"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-sm text-gray-900">Hàng chờ khám</span>
            {notifs.length > 0 && (
              <button onClick={handleClear} className="text-xs text-red-500 font-medium hover:underline">
                Xóa tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <div className="flex justify-center mb-2"><Hospital className="w-8 h-8 text-gray-300" /></div>
                Chưa có bệnh nhân mới
              </div>
            ) : (
              notifs.map(n => (
                <div key={n.id}
                  onClick={() => { navigate('/doctor/today'); setOpen(false); }}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${n.read ? 'bg-white' : 'bg-blue-50/60'}`}>
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-snug ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {n.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{n.sub}</div>
                    <div className="text-[11px] text-blue-400 mt-1 font-medium">Xem hàng chờ →</div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chuông thông báo cho Bệnh nhân (DB-backed) ───────────────────────────────
function NotificationBell() {
  const { user: bellUser } = useAuth();
  const [open,         setOpen]         = useState(false);
  const [notifs,       setNotifs]       = useState<Notification[]>([]);
  const [unread,       setUnread]       = useState(0);
  const [loading,      setLoading]      = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getAll();
      setNotifs(data);
      setUnread(data.filter(n => !n.isRead).length);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lần đầu
  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // Reload chuông mỗi khi có bất kỳ sự kiện nào gửi đến patient topic:
  // appointment_updated (xác nhận/hủy/gọi vào/xong/no_show/nhắc lịch)
  // + prescription_created (bác sĩ kê đơn)
  // + invoice_created (lễ tân thu tiền)
  useSocket(
    () => { loadNotifs(); },
    { topics: bellUser?.id ? [`/topic/patient/${bellUser.id}`] : [], enabled: !!bellUser?.id },
  );

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      await notificationApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    }
  };

  const handleMarkOne = async (id: number) => {
    await notificationApi.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        title="Thông báo"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-sm text-gray-900">Thông báo</span>
            {notifs.some(n => !n.isRead) && (
              <button
                onClick={async () => {
                  await notificationApi.markAllRead();
                  setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
                  setUnread(0);
                }}
                className="text-xs text-primary font-medium hover:underline"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <div className="flex justify-center mb-2"><Bell className="w-8 h-8 text-gray-300" /></div>
                Chưa có thông báo nào
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkOne(n.id)}
                  className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer
                    ${n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-50'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {typeIcon[n.type] ?? <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm leading-snug ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {n.title}
                    </div>
                    {n.message && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                    )}
                    <div className="text-[11px] text-gray-400 mt-1">{fmtTimeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleCode = user?.role.code ?? 'patient';
  const menu = menuByRole[roleCode] ?? [];

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-[#1a3a5c] text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1a3a5c]'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[#1a3a5c] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-[#1a3a5c] leading-none">VietSkin</div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
              {roleLabel[roleCode]}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50">
          <div className="w-7 h-7 bg-[#1a3a5c]/10 rounded-full flex items-center justify-center text-[#1a3a5c] font-bold text-xs flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm truncate text-gray-900">{user?.name}</div>
            <div className="text-[11px] text-gray-400 truncate">{user?.phone}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {roleCode === 'patient'      && <NotificationBell />}
            {roleCode === 'receptionist' && <ReceptionistNotificationBell />}
            {roleCode === 'doctor'       && <DoctorNotificationBell />}
            <div className="w-8 h-8 bg-[#1a3a5c]/10 rounded-full flex items-center justify-center text-[#1a3a5c] font-bold text-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-gray-900 leading-none">{user?.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{user?.role.name}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast thông báo bệnh nhân khám xong (chỉ hiện cho Lễ tân) */}
      <ExamToast />
    </div>
  );
}
