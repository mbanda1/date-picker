import { parseTime } from './dates';
import { formatTimeLabel } from './locale';

export interface TimeOption {
  /** "HH:mm", 24-hour. */
  value: string;
  label: string;
}

export interface TimeOptionsConfig {
  minTime?: string;
  maxTime?: string;
  /** Minutes between options. */
  interval?: number;
  locale?: string;
  hour12?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const toTimeValue = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const getTimeOptions = ({
  minTime = '00:00',
  maxTime = '23:59',
  interval = 30,
  locale,
  hour12,
}: TimeOptionsConfig = {}): TimeOption[] => {
  const min = parseTime(minTime) ?? { hours: 0, minutes: 0 };
  const max = parseTime(maxTime) ?? { hours: 23, minutes: 59 };
  const step = Number.isFinite(interval) && interval > 0 ? Math.floor(interval) : 30;
  const end = max.hours * 60 + max.minutes;
  const options: TimeOption[] = [];
  for (let m = min.hours * 60 + min.minutes; m <= end; m += step) {
    const value = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    options.push({ value, label: formatTimeLabel(value, locale, hour12) });
  }
  return options;
};
