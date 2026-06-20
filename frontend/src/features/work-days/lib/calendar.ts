export const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const VN_WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function buildCalendar(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const d = new Date(year, month, 1);
  const startDow = d.getDay();
  const offset = startDow === 0 ? 6 : startDow - 1;
  let week: (Date | null)[] = Array(offset).fill(null);
  while (d.getMonth() === month) {
    week.push(new Date(d));
    if (week.length === 7) { weeks.push(week); week = []; }
    d.setDate(d.getDate() + 1);
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export const isoDate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];

export const monthStr = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`;
