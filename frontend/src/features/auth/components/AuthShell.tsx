import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const ICONS: Record<string, ReactNode> = {
  calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  record: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  chat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />,
  notify: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
};

interface Props {
  heading: ReactNode;
  subtitle: string;
  features: { icon: string; text: string }[];
  formTitle: string;
  formSubtitle: string;
  children: ReactNode;
}

export function AuthShell({ heading, subtitle, features, formTitle, formSubtitle, children }: Props) {
  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex flex-col w-[460px] flex-shrink-0 bg-[#1a3a5c] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 flex flex-col h-full p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">VietSkin</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold leading-snug text-white">{heading}</h2>
              <p className="text-blue-200/70 mt-3 text-sm leading-relaxed">{subtitle}</p>
            </div>
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{ICONS[f.icon]}</svg>
                  </div>
                  <span className="text-blue-100/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-blue-200/40">© 2024 VietSkin Clinic</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-[#1a3a5c] font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            VietSkin
          </Link>
          <Link to="/" className="hidden lg:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Trang chủ
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{formTitle}</h1>
              <p className="text-sm text-gray-500 mt-1">{formSubtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
