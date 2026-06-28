import { useState } from 'react';
import { Banknote, Users, Activity } from 'lucide-react';
import RevenueStatsPage from './RevenueStatsPage';
import PatientStatsPage from './PatientStatsPage';
import ServiceStatsPage from './ServiceStatsPage';

type TabKey = 'revenue' | 'patient' | 'service';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'revenue', label: 'Doanh thu', icon: <Banknote className="w-4 h-4" /> },
  { key: 'patient', label: 'Bệnh nhân', icon: <Users className="w-4 h-4" /> },
  { key: 'service', label: 'Dịch vụ',   icon: <Activity className="w-4 h-4" /> },
];

export default function StatsPage() {
  const [tab, setTab] = useState<TabKey>('revenue');

  return (
    <div className="space-y-6">
      {/* Thanh tab */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors
                ${active
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Nội dung tab — render có điều kiện nên mỗi trang chỉ mount (và gọi API)
          khi tab tương ứng được mở lần đầu => lazy load tự nhiên. */}
      {tab === 'revenue' && <RevenueStatsPage />}
      {tab === 'patient' && <PatientStatsPage />}
      {tab === 'service' && <ServiceStatsPage />}
    </div>
  );
}
