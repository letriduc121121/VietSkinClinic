export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
};

export const fmtMoney = (value: number | null | undefined) =>
  value ? value.toLocaleString('vi-VN') + ' đ' : '—';

export const fmtVnd = (value: number | string) => Number(value).toLocaleString('vi-VN') + 'đ';

export const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
};

export const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
