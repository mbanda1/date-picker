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

const MAX_SHORT_WEEKDAY = 4;

/**
 * Weekday names in display order. "auto" uses the short form unless the locale's
 * short names are longer than four characters (e.g. Arabic), then the narrow form.
 */
export const getWeekdayNames = (
  locale: string = DEFAULT_LOCALE,
  weekStartsOn: WeekDay = 0,
  width: 'short' | 'narrow' | 'auto' = 'auto',
): WeekdayName[] => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(REFERENCE_SUNDAY);
    day.setDate(REFERENCE_SUNDAY.getDate() + ((weekStartsOn + i) % 7));
    return day;
  });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const format = (w: 'short' | 'narrow') => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: w });
    return days.map(day => fmt.format(day));
  };
  let short = format(width === 'narrow' ? 'narrow' : 'short');
  if (width === 'auto' && short.some(name => name.length > MAX_SHORT_WEEKDAY)) short = format('narrow');
  return days.map((day, i) => ({ short: short[i], long: long.format(day) }));
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

export interface Formatters {
  locale: string;
  day: (date: Date) => string;
  fullDate: (date: Date) => string;
  monthYear: (date: Date) => string;
  year: (date: Date) => string;
  monthNames: string[];
}

/** Builds the Intl formatters once per locale; reuse them across renders. */
export const createFormatters = (locale: string = DEFAULT_LOCALE): Formatters => {
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
  const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const year = new Intl.DateTimeFormat(locale, { year: 'numeric' });
  return {
    locale,
    day: d => day.format(d),
    fullDate: d => fullDate.format(d),
    monthYear: d => monthYear.format(d),
    year: d => year.format(d),
    monthNames: getMonthNames(locale),
  };
};

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
