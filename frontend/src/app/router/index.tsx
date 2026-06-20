import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

import DashboardLayout from '@/app/layouts/DashboardLayout';
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Patient
import PatientDashboard from '@/pages/patient/DashboardPage';
import BookingPage from '@/pages/patient/BookingPage';
import AppointmentsPage from '@/pages/patient/AppointmentsPage';
import PatientRecordsPage from '@/pages/patient/RecordsPage';
import PatientInvoicesPage from '@/pages/patient/InvoicesPage';
import ProfilePage from '@/pages/patient/ProfilePage';

// Receptionist
import ReceptionistDashboard from '@/pages/receptionist/DashboardPage';
import AppointmentListPage from '@/pages/receptionist/AppointmentListPage';
import ConfirmAppointmentsPage from '@/pages/receptionist/ConfirmAppointmentsPage';
import CheckInPage from '@/pages/receptionist/CheckInPage';
import CollectPaymentPage from '@/pages/receptionist/CollectPaymentPage';

// Doctor
import DoctorDashboard from '@/pages/doctor/DashboardPage';
import TodaySchedulePage from '@/pages/doctor/TodaySchedulePage';
import WorkSchedulePage from '@/pages/doctor/WorkSchedulePage';
import ExaminePage from '@/pages/doctor/ExaminePage';
import HistoryPage from '@/pages/doctor/HistoryPage';

// Admin
import AdminDashboard from '@/pages/admin/DashboardPage';
import StaffManagementPage from '@/pages/admin/StaffManagementPage';
import PatientManagementPage from '@/pages/admin/PatientManagementPage';
import ServiceManagementPage from '@/pages/admin/ServiceManagementPage';
import ScheduleManagementPage from '@/pages/admin/ScheduleManagementPage';
import RoomsPage from '@/pages/admin/RoomsPage';
import StatsPage from '@/pages/admin/StatsPage';
import MedicineManagementPage from '@/pages/admin/MedicineManagementPage';

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-main-bg">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const getRoleCode = (user: any) => {
  if (!user?.role) return '';
  return typeof user.role === 'string' ? user.role : user.role.code;
};

const RedirectIfAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    const roleCode = getRoleCode(user);
    const map: Record<string, string> = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      receptionist: '/receptionist/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={map[roleCode] ?? '/'} replace />;
  }
  return <Outlet />;
};

const RequireAuth = ({ roles }: { roles: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  const roleCode = getRoleCode(user);
  if (!roles.includes(roleCode)) return <Navigate to="/" replace />;
  return <Outlet />;
};

import ChatbotWidget from '@/features/chatbot/components/ChatbotWidget';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth — redirect if already logged in */}
        <Route element={<RedirectIfAuth />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Patient */}
        <Route element={<RequireAuth roles={['patient']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/booking" element={<BookingPage />} />
            <Route path="/patient/appointments" element={<AppointmentsPage />} />
            <Route path="/patient/records" element={<PatientRecordsPage />} />
            <Route path="/patient/invoices" element={<PatientInvoicesPage />} />
            <Route path="/patient/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Receptionist */}
        <Route element={<RequireAuth roles={['receptionist']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/appointments" element={<AppointmentListPage />} />
            <Route path="/receptionist/confirm" element={<ConfirmAppointmentsPage />} />
            <Route path="/receptionist/checkin" element={<CheckInPage />} />
            <Route path="/receptionist/billing" element={<CollectPaymentPage />} />
            <Route path="/receptionist/patients" element={<PatientManagementPage />} />
            <Route path="/receptionist/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Doctor */}
        <Route element={<RequireAuth roles={['doctor']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/today" element={<TodaySchedulePage />} />
            <Route path="/doctor/work-schedule" element={<WorkSchedulePage />} />
            <Route path="/doctor/history" element={<HistoryPage />} />
            <Route path="/doctor/examine/:appointmentId" element={<ExaminePage />} />
            <Route path="/doctor/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<RequireAuth roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<StaffManagementPage />} />
            <Route path="/admin/patients" element={<PatientManagementPage />} />
            <Route path="/admin/services" element={<ServiceManagementPage />} />
            <Route path="/admin/schedule" element={<ScheduleManagementPage />} />
            <Route path="/admin/rooms" element={<RoomsPage />} />
            <Route path="/admin/stats" element={<StatsPage />} />
            {/* Đường cũ → chuyển hướng về trang thống kê gộp */}
            <Route path="/admin/revenue" element={<Navigate to="/admin/stats" replace />} />
            <Route path="/admin/patient-stats" element={<Navigate to="/admin/stats" replace />} />
            <Route path="/admin/medicines" element={<MedicineManagementPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </BrowserRouter>
  );
}
