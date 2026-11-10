import { parseTime } from './dates';
import type { WeekDay } from './types';

export const DEFAULT_LOCALE = 'en-US';

/** A known Sunday, used to read weekday names from Intl. */
const REFERENCE_SUNDAY = new Date(2026, 0, 4);

type WeekInfo = { firstDay: number };
type LocaleWithWeekInfo = Intl.Locale & {
  getWeekInfo?: () => WeekInfo;
  weekInfo?: WeekInfo;
};

/** First day of the week for a locale, from Intl when the runtime supports it. */
export const getWeekStartsOn = (locale: string = DEFAULT_LOCALE, fallback: WeekDay = 0): WeekDay => {
  try {
    const loc = new Intl.Locale(locale) as LocaleWithWeekInfo;
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info && info.firstDay >= 1 && info.firstDay <= 7) return (info.firstDay % 7) as WeekDay;
  } catch {
    return fallback;
  }
  return fallback;
};

export interface WeekdayName {
  short: string;
  long: string;
}

export const getWeekdayNames = (
  locale: string = DEFAULT_LOCALE,
  weekStartsOn: WeekDay = 0,
  width: 'short' | 'narrow' = 'short',
): WeekdayName[] => {
  const short = new Intl.DateTimeFormat(locale, { weekday: width });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(REFERENCE_SUNDAY);
    day.setDate(REFERENCE_SUNDAY.getDate() + ((weekStartsOn + i) % 7));
    return { short: short.format(day), long: long.format(day) };
  });
};

export const getMonthNames = (
  locale: string = DEFAULT_LOCALE,
  width: 'long' | 'short' = 'long',
): string[] => {
  const fmt = new Intl.DateTimeFormat(locale, { month: width });
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2026, m, 1)));
};

export const formatMonthYear = (date: Date, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);

export const formatYear = (date: Date, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(date);

export const formatDayNumber = (date: Date, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date);

/** Accessible label for a day cell, e.g. "Monday, March 3, 2025". */
export const formatFullDate = (date: Date, locale: string = DEFAULT_LOCALE) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date);

export const formatTimeLabel = (
  time: string,
  locale: string = DEFAULT_LOCALE,
  hour12?: boolean,
): string => {
  const parsed = parseTime(time);
  if (!parsed) return time;
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12 }).format(
    new Date(2026, 0, 1, parsed.hours, parsed.minutes),
  );
};
