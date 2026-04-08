import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function parseRepeatUntilInput(raw: string | undefined | null, tz: string): Date | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return dayjs.tz(s, 'YYYY-MM-DD', tz).endOf('day').utc().toDate();
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
