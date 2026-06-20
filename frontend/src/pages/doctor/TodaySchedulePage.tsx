import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@/shared/components/Alert';
import { useDoctorQueue, type QueueItem } from '@/features/appointments/hooks/useDoctorQueue';

const getName = (item: QueueItem) => item.patientName || item.patient?.name || 'Khách lẻ';
const getCode = (item: QueueItem) => item.patient?.patientProfile?.patientCode ?? 'Khách lẻ';

export default function TodaySchedulePage() {
  const navigate = useNavigate();
  const { items, loading, calling, error, promote } = useDoctorQueue();
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress' | 'done'>('waiting');
  const [searchTxt, setSearchTxt] = useState('');

  const waiting = items.filter(i => i.status === 'checked_in').sort((a, b) => (a.queueNumber ?? 99) - (b.queueNumber ?? 99));
  const inProgress = items.filter(i => i.status === 'in_progress');
  const done = items.filter(i => i.status === 'done').sort((a, b) => (a.queueNumber ?? 99) - (b.queueNumber ?? 99));

  const currentList = activeTab === 'in_progress' ? inProgress : activeTab === 'done' ? done : waiting;
  const displayedList = currentList.filter(item =>
    getName(item).toLowerCase().includes(searchTxt.toLowerCase()) ||
    getCode(item).toLowerCase().includes(searchTxt.toLowerCase()),
  );

  const handleAction = async (item: QueueItem) => {
    if (item.status === 'checked_in') {
      if (await promote(item.id)) navigate(`/doctor/examine/${item.id}`);
    } else {
      navigate(`/doctor/examine/${item.id}`);
    }
  };

  const TABS = [
    { key: 'waiting', label: 'TIẾP NHẬN', count: waiting.length, badge: 'bg-red-500' },
    { key: 'in_progress', label: 'ĐANG KHÁM', count: inProgress.length, badge: 'bg-blue-500' },
    { key: 'done', label: 'ĐÃ KHÁM', count: done.length, badge: 'bg-green-500' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Danh sách bệnh nhân</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-8 px-6 pt-5 border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === t.key ? 'border-[#115e59] text-[#115e59]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
              <span className={`${t.badge} text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none pt-0.5`}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="relative flex items-center w-full max-w-full">
            <div className="absolute left-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTxt}
              onChange={e => setSearchTxt(e.target.value)}
              placeholder="Tìm kiếm theo tên khách hàng"
              className="w-full border border-gray-200 rounded-lg pl-11 pr-28 py-3 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
            />
            <button className="absolute right-2 text-xs font-bold text-[#1a3a5c] hover:text-[#0f2540] px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors uppercase">
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] text-[#475569]">
              <tr>
                <th className="px-6 py-4 font-bold w-16">#</th>
                <th className="px-4 py-4 font-bold">Mã bệnh nhân</th>
                <th className="px-4 py-4 font-bold">Họ và tên</th>
                <th className="px-4 py-4 font-bold">SĐT</th>
                <th className="px-4 py-4 font-bold">Giờ khám</th>
                <th className="px-4 py-4 font-bold w-1/3">Triệu chứng</th>
                <th className="px-6 py-4 font-bold text-center">Tuỳ Chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                    </div>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Không có bệnh nhân nào</td>
                </tr>
              ) : (
                displayedList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.queueNumber ?? index + 1}</td>
                    <td className="px-4 py-4 text-gray-600 font-mono text-xs">{getCode(item)}</td>
                    <td className="px-4 py-4 font-medium text-gray-900">{getName(item)}</td>
                    <td className="px-4 py-4 text-gray-600">{item.patientPhone || item.patient?.phone || '–'}</td>
                    <td className="px-4 py-4 text-gray-600">
                      <span className="font-semibold text-gray-800">{item.time.slice(0, 5)}</span>
                      {item.service && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px]">{item.service.name}</div>}
                    </td>
                    <td className="px-4 py-4 text-gray-600 truncate max-w-[200px]" title={item.symptoms || ''}>{item.symptoms || '–'}</td>
                    <td className="px-6 py-4 flex justify-center">
                      <button
                        title={item.status === 'checked_in' ? 'Gọi khám' : item.status === 'in_progress' ? 'Tiếp tục khám' : 'Xem bệnh án'}
                        onClick={() => handleAction(item)}
                        disabled={calling === item.id}
                        className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center hover:bg-cyan-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      >
                        {calling === item.id ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
