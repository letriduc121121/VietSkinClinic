import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { imgSrc } from '@/shared/lib/utils';
import { useLandingData } from '@/features/public/hooks/useLandingData';

const roleRedirect: Record<string, string> = {
  patient:      '/patient/dashboard',
  doctor:       '/doctor/dashboard',
  receptionist: '/receptionist/dashboard',
  admin:        '/admin/dashboard',
};

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { doctors, services, doctorCount } = useLandingData();

  const [currentServicePage, setCurrentServicePage] = useState(1);
  const [currentDoctorPage, setCurrentDoctorPage] = useState(1);
  const SERVICES_PER_PAGE = 6;
  const DOCTORS_PER_PAGE = 4;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const totalServicePages = Math.ceil(services.length / SERVICES_PER_PAGE);
  const paginatedServices = services.slice(
    (currentServicePage - 1) * SERVICES_PER_PAGE,
    currentServicePage * SERVICES_PER_PAGE
  );

  const totalDoctorPages = Math.ceil(doctors.length / DOCTORS_PER_PAGE);
  const paginatedDoctors = doctors.slice(
    (currentDoctorPage - 1) * DOCTORS_PER_PAGE,
    currentDoctorPage * DOCTORS_PER_PAGE
  );

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="bg-[#1a3a5c] text-white text-xs py-2 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              T2 – T7: 08:00 – 17:00
            </span>
          </div>
          <a href="tel:02412345678" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
            <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            024 1234 5678
          </a>
        </div>
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-[#1a3a5c] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#1a3a5c] tracking-tight">VietSkin</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#" className="text-[#1a3a5c] font-semibold border-b-2 border-[#1a3a5c] pb-0.5">Trang chủ</a>
            <a href="#services" className="hover:text-[#1a3a5c] transition-colors">Dịch vụ</a>
            <a href="#doctors"  className="hover:text-[#1a3a5c] transition-colors">Bác sĩ</a>
            <a href="#process"  className="hover:text-[#1a3a5c] transition-colors">Quy trình</a>
            <a href="#contact"  className="hover:text-[#1a3a5c] transition-colors">Liên hệ</a>
          </div>

          {/* Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <div className="w-6 h-6 bg-[#1a3a5c] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Đã đăng nhập</p>
                      <p className="font-semibold text-sm truncate mt-0.5">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.role.name}</p>
                    </div>
                    <Link to={roleRedirect[user.role.code] ?? '/'} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#1a3a5c] transition-colors">Đăng nhập</Link>
                <Link to="/register" className="px-4 py-2 bg-[#1a3a5c] text-white text-sm font-semibold rounded-lg hover:bg-[#0f2540] transition-colors">Đặt lịch ngay</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(v => !v)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            {[
              { label: 'Trang chủ', href: '#' },
              { label: 'Dịch vụ',   href: '#services' },
              { label: 'Bác sĩ',    href: '#doctors' },
              { label: 'Quy trình', href: '#process' },
              { label: 'Liên hệ',   href: '#contact' },
            ].map(item => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-gray-700 hover:text-[#1a3a5c] py-1">{item.label}</a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex gap-3">
              <Link to="/login"    onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2 border border-gray-200 rounded-lg text-sm font-medium">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2 bg-[#1a3a5c] text-white rounded-lg text-sm font-semibold">Đặt lịch</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-14 lg:py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6">
            <span className="inline-block bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-200 uppercase tracking-widest">
              Phòng khám Da liễu VietSkin
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
              Da liễu chuẩn y khoa —<br />
              <span className="text-[#1a3a5c]">Tận tâm</span> từng làn da
            </h1>
            <p className="text-gray-500 leading-relaxed max-w-md text-base">
              Phòng khám VietSkin chuyên thăm khám và điều trị chuyên sâu các bệnh lý da liễu và thẩm mỹ da.
              Đội ngũ bác sĩ trình độ chuyên môn cao, đồng hành cùng liệu trình cá nhân hóa tối ưu cho từng làn da.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/register" className="px-6 py-3 bg-[#1a3a5c] text-white font-semibold rounded-lg hover:bg-[#0f2540] transition-colors text-sm">
                Đặt lịch khám
              </Link>
              <a href="#services" className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-[#1a3a5c] hover:text-[#1a3a5c] transition-colors text-sm">
                Xem dịch vụ
              </a>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
              {[
                { val: '98%', label: 'Tỷ lệ hài lòng' },
                { val: String(doctorCount || 2), label: 'Bác sĩ chuyên khoa' },
                { val: '24',  label: 'Slot khám / ngày' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-[#1a3a5c]">{s.val}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image — đặt ảnh thật vào src bên dưới */}
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
              alt="Phòng khám VietSkin"
              className="w-full h-[420px] lg:h-[500px] rounded-2xl object-cover"
            />
            {/* Floating badge */}
            <div className="absolute -bottom-4 left-6 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">Xác nhận lịch hẹn</div>
                <div className="text-xs text-gray-500">Trong vòng 5 phút</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dịch vụ ──────────────────────────────────────────────────────── */}
      <section id="services" className="bg-gray-50 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a3a5c] mb-2">Dịch vụ chuyên khoa</p>
            <h2 className="text-3xl font-bold text-gray-900">Giải pháp điều trị da toàn diện</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedServices.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                {s.imageUrl ? (
                  <img src={imgSrc(s.imageUrl)!} alt={s.name} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#1a3a5c] transition-colors mb-2">{s.name}</h3>
                  {s.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{s.description}</p>
                  )}
                  {/* Giá luôn hiển thị, đẩy xuống đáy thẻ để các thẻ đồng đều */}
                  <div className="mt-auto pt-1 flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-400">Từ</span>
                    <span className="text-base font-bold text-[#1a3a5c]">
                      {Number(s.price).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 text-sm">Đang tải danh sách dịch vụ...</div>
            )}
          </div>

          {/* Cấu hình phân trang dịch vụ */}
          {totalServicePages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={currentServicePage === 1}
                onClick={() => setCurrentServicePage(p => Math.max(p - 1, 1))}
                className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:text-[#1a3a5c] hover:border-[#1a3a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trang trước"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalServicePages }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrent = pageNum === currentServicePage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentServicePage(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                        isCurrent
                          ? 'bg-[#1a3a5c] text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:text-[#1a3a5c] hover:border-[#1a3a5c]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentServicePage === totalServicePages}
                onClick={() => setCurrentServicePage(p => Math.min(p + 1, totalServicePages))}
                className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:text-[#1a3a5c] hover:border-[#1a3a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trang sau"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Bác sĩ ───────────────────────────────────────────────────────── */}
      <section id="doctors" className="bg-white py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a3a5c] mb-2">Đội ngũ y bác sĩ</p>
            <h2 className="text-3xl font-bold text-gray-900">Gặp gỡ các chuyên gia</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedDoctors.map(doc => {
              const name    = doc.user?.name ?? 'Bác sĩ';
              const avatar  = doc.user?.avatar;
              const initial = name.split(' ').pop()?.charAt(0).toUpperCase() ?? 'B';
              const fee     = Number(doc.consultationFee).toLocaleString('vi-VN') + 'đ';
              return (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  {/* Ảnh bác sĩ */}
                  {avatar ? (
                    <img
                      src={imgSrc(avatar)!}
                      alt={name}
                      className="w-full h-48 object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#1a3a5c]/10 flex items-center justify-center text-3xl font-bold text-[#1a3a5c]">
                        {initial}
                      </div>
                    </div>
                  )}
                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">{name}</h3>
                    <p className="text-xs text-teal-600 font-medium mt-0.5">{doc.specialty ?? 'Da liễu'}</p>
                    <div className="mt-3 space-y-1 text-xs text-gray-500 flex-1">
                      {doc.degree && <div>{doc.degree}</div>}
                      {doc.experience && <div>{doc.experience} kinh nghiệm</div>}
                      <div className="font-semibold text-gray-700 pt-1">Phí khám: {fee}</div>
                    </div>
                    <Link to="/register" className="mt-4 block text-center text-xs font-semibold text-[#1a3a5c] border border-[#1a3a5c] px-3 py-2 rounded-lg hover:bg-[#1a3a5c] hover:text-white transition-colors">
                      Đặt lịch
                    </Link>
                  </div>
                </div>
              );
            })}
            {doctors.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 text-sm">Đang tải danh sách bác sĩ...</div>
            )}
          </div>

          {/* Cấu hình phân trang bác sĩ */}
          {totalDoctorPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={currentDoctorPage === 1}
                onClick={() => setCurrentDoctorPage(p => Math.max(p - 1, 1))}
                className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:text-[#1a3a5c] hover:border-[#1a3a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trang trước"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalDoctorPages }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrent = pageNum === currentDoctorPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentDoctorPage(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                        isCurrent
                          ? 'bg-[#1a3a5c] text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:text-[#1a3a5c] hover:border-[#1a3a5c]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentDoctorPage === totalDoctorPages}
                onClick={() => setCurrentDoctorPage(p => Math.min(p + 1, totalDoctorPages))}
                className="flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:text-[#1a3a5c] hover:border-[#1a3a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trang sau"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Quy trình ────────────────────────────────────────────────────── */}
      <section id="process" className="bg-gray-50 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a3a5c] mb-2">Quy trình khám bệnh</p>
            <h2 className="text-3xl font-bold text-gray-900">Từ đặt lịch đến nhận kết quả</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Đặt lịch online',     desc: 'Chọn bác sĩ, ngày giờ phù hợp trực tiếp trên hệ thống.' },
              { step: '02', title: 'Đến & thanh toán',    desc: 'Lễ tân tiếp nhận, thu phí và cấp số thứ tự cho bệnh nhân.' },
              { step: '03', title: 'Khám chuyên sâu',     desc: 'Bác sĩ thăm khám, chẩn đoán và tư vấn liệu trình điều trị.' },
              { step: '04', title: 'Nhận đơn & theo dõi', desc: 'Nhận đơn thuốc điện tử, theo dõi tiến trình qua ứng dụng.' },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-[#1a3a5c] text-3xl font-bold mb-3">{p.step}</div>
                <h3 className="font-bold text-gray-900 mb-1.5">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Bắt đầu chăm sóc làn da của bạn</h2>
          <p className="text-gray-500 mb-8 text-sm">Đặt lịch ngay hôm nay — hệ thống xác nhận trong vài phút, không cần chờ đợi lâu.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-3 bg-[#1a3a5c] text-white font-semibold rounded-lg hover:bg-[#0f2540] transition-colors text-sm">
              Đặt lịch khám ngay
            </Link>
            <a href="tel:02412345678" className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-[#1a3a5c] hover:text-[#1a3a5c] transition-colors text-sm">
              Gọi: 024 1234 5678
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-gray-900 text-gray-400 pt-14 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 pb-10 border-b border-gray-800">
            {/* Left — Info */}
            <div className="space-y-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[#1a3a5c] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">VietSkin</span>
                </div>
                <p className="text-sm leading-relaxed">
                  Phòng khám da liễu chuyên sâu, điều trị các bệnh lý và thẩm mỹ da.
                </p>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Liên hệ</h4>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    175 Tây Sơn, Đống Đa, Hà Nội
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    024 1234 5678
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    T2 – T7: 08:00 – 17:00
                  </li>
                </ul>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Hệ thống</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/login"    className="hover:text-white transition-colors">Đăng nhập</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Đăng ký bệnh nhân</Link></li>
                </ul>
              </div>
            </div>

            {/* Right — Map */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Bản đồ</h4>
              <div className="rounded-xl overflow-hidden border border-gray-700">
                <iframe
                  title="Vị trí phòng khám VietSkin"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.6409459344485!2d105.82251057530064!3d21.00702528063737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac812abdc24b%3A0xe54d9237ec71ab2a!2zMTc1IFTDonkgU8ahbiwgVHJ1bmcgTGnhu4d0LCDEkOG7kW5nIMSQYSwgSMOgIE7hu5lpLCBWaWV0bmFt!5e0!3m2!1svi!2s!4v1718000000000"
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 text-xs">
            <span>© 2024 VietSkin Dermatology Clinic. Đồ án tốt nghiệp.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
