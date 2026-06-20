export const statusLabel: Record<string, { text: string; cls: string }> = {
  pending:     { text: 'Chờ xác nhận', cls: 'bg-yellow-50 text-yellow-700' },
  confirmed:   { text: 'Đã xác nhận',  cls: 'bg-blue-50 text-blue-700' },
  checked_in:  { text: 'Đã check-in',  cls: 'bg-indigo-50 text-indigo-700' },
  in_progress: { text: 'Đang khám',    cls: 'bg-purple-50 text-purple-700' },
  done:        { text: 'Hoàn thành',   cls: 'bg-green-50 text-green-700' },
  cancelled:   { text: 'Đã huỷ',      cls: 'bg-red-50 text-red-600' },
  no_show:     { text: 'Không đến',   cls: 'bg-gray-100 text-gray-500' },
};

export const statusBadge: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-[#1a3a5c]' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700' },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600' },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-500' },
};

export const STATUS_PRIORITY: Record<string, number> = {
  pending: 0, confirmed: 1, checked_in: 2, in_progress: 3, done: 4, cancelled: 5, no_show: 6,
};
