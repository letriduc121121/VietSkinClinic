export const METHOD_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  cash:          { label: 'Tiền mặt',     cls: 'bg-green-100 text-green-700',   icon: '💵' },
  qr_code:       { label: 'QR Code',      cls: 'bg-indigo-100 text-indigo-700', icon: '📱' },
  bank_transfer: { label: 'Chuyển khoản', cls: 'bg-blue-100 text-blue-700',     icon: '🏦' },
  card:          { label: 'Thẻ',          cls: 'bg-amber-100 text-amber-700',   icon: '💳' },
};
