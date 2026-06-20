export const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmtVN = (iso: string) => {
  if (!iso) return '';
  const [y, m, day] = iso.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(day));
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
  return `${dow}, ${day}/${m}/${y}`;
};

export interface MonthCell { iso: string; day: number; disabled: boolean; today: boolean }

export function buildMonthGrid(year: number, month: number): (MonthCell | null)[] {
  const lastDay = new Date(year, month + 1, 0);
  const startCol = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = fmt(new Date());
  const cells: (MonthCell | null)[] = [];
  for (let i = 0; i < startCol; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const iso = fmt(date);
    const dow = date.getDay();
    cells.push({ iso, day: d, disabled: dow === 0 || dow === 6 || iso < today, today: iso === today });
  }
  return cells;
}
