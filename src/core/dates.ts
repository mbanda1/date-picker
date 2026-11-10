import {
  addMonths,
  differenceInCalendarMonths,
  endOfMonth,
  getYear,
  isAfter,
  isBefore,
  isValid,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import type { Bounds, PickerConfig } from './types';

export const YEAR_PAGE_SIZE = 12;

export const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && isValid(value);

export const getBounds = (config: Pick<PickerConfig, 'minDate' | 'maxDate'>): Bounds => {
  let min = isValidDate(config.minDate) ? startOfDay(config.minDate) : undefined;
  let max = isValidDate(config.maxDate) ? startOfDay(config.maxDate) : undefined;
  if (min && max && isAfter(min, max)) [min, max] = [max, min];
  return { min, max };
};

export const isOutOfBounds = (date: Date, { min, max }: Bounds): boolean => {
  const day = startOfDay(date);
  return Boolean((min && isBefore(day, min)) || (max && isAfter(day, max)));
};

export const clampDate = (date: Date, { min, max }: Bounds): Date => {
  if (min && isBefore(startOfDay(date), min)) return min;
  if (max && isAfter(startOfDay(date), max)) return max;
  return date;
};

export const isDayDisabled = (date: Date, config: PickerConfig, bounds = getBounds(config)) =>
  Boolean(config.disabled) || isOutOfBounds(date, bounds);

export const isDayUnavailable = (date: Date, config: PickerConfig) =>
  Boolean(config.isDateUnavailable?.(date));

export const isMonthDisabled = (year: number, month: number, bounds: Bounds): boolean => {
  const first = new Date(year, month, 1);
  return Boolean(
    (bounds.min && isBefore(endOfMonth(first), bounds.min)) ||
      (bounds.max && isAfter(first, bounds.max)),
  );
};

export const isYearDisabled = (year: number, { min, max }: Bounds): boolean =>
  Boolean((min && year < getYear(min)) || (max && year > getYear(max)));

/** Same day-of-month in another month/year, clamped to that month's last day. */
export const moveToMonth = (date: Date, year: number, month: number): Date => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const next = new Date(date);
  next.setFullYear(year, month, Math.min(date.getDate(), lastDay));
  return next;
};

export const getYearPageStart = (year: number) =>
  Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;

/**
 * Keeps the visible months inside the selectable bounds where possible.
 * When the bounds span fewer months than are shown, the min side wins.
 */
export const clampVisibleMonth = (
  month: Date,
  bounds: Bounds,
  numberOfMonths: number,
): Date => {
  let first = startOfMonth(month);
  if (bounds.max) {
    const lastAllowed = startOfMonth(bounds.max);
    const lastShown = addMonths(first, numberOfMonths - 1);
    if (isAfter(lastShown, lastAllowed)) first = addMonths(lastAllowed, -(numberOfMonths - 1));
  }
  if (bounds.min && isBefore(first, startOfMonth(bounds.min))) first = startOfMonth(bounds.min);
  return first;
};

/** Shift the visible window only as far as needed to show `date`. */
export const revealMonth = (visibleMonth: Date, date: Date, numberOfMonths: number): Date => {
  const offset = differenceInCalendarMonths(date, visibleMonth);
  if (offset < 0) return startOfMonth(date);
  if (offset >= numberOfMonths) return addMonths(startOfMonth(date), -(numberOfMonths - 1));
  return visibleMonth;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as "yyyy-MM-dd". */
export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const fromDateKey = (key: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toDateKey(date) === key ? date : null;
};

export const parseTime = (time: string): { hours: number; minutes: number } | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

export const withTime = (date: Date, time: string): Date => {
  const parsed = parseTime(time);
  return parsed ? setMinutes(setHours(date, parsed.hours), parsed.minutes) : date;
};

export const copyTime = (target: Date, source: Date | null): Date =>
  source ? setMinutes(setHours(target, source.getHours()), source.getMinutes()) : target;
