import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import type { DateRange, WeekDay } from './types';

export interface RangePreset {
  id: string;
  label: string;
  getRange: (now: Date, options: { weekStartsOn: WeekDay }) => DateRange;
}

export const DEFAULT_RANGE_PRESETS: RangePreset[] = [
  {
    id: 'today',
    label: 'Today',
    getRange: now => ({ start: startOfDay(now), end: endOfDay(now) }),
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    getRange: now => {
      const day = subDays(now, 1);
      return { start: startOfDay(day), end: endOfDay(day) };
    },
  },
  {
    id: 'this-week',
    label: 'This Week',
    getRange: (now, { weekStartsOn }) => ({
      start: startOfWeek(now, { weekStartsOn }),
      end: endOfWeek(now, { weekStartsOn }),
    }),
  },
  {
    id: 'last-week',
    label: 'Last Week',
    getRange: (now, { weekStartsOn }) => {
      const day = subWeeks(now, 1);
      return { start: startOfWeek(day, { weekStartsOn }), end: endOfWeek(day, { weekStartsOn }) };
    },
  },
  {
    id: 'last-7-days',
    label: 'Last 7 Days',
    getRange: now => ({ start: startOfDay(subDays(now, 6)), end: endOfDay(now) }),
  },
  {
    id: 'this-month',
    label: 'This Month',
    getRange: now => ({ start: startOfMonth(now), end: endOfMonth(now) }),
  },
  {
    id: 'last-3-months',
    label: 'Last 3 Months',
    getRange: now => ({ start: startOfDay(subMonths(now, 3)), end: endOfDay(now) }),
  },
  {
    id: 'this-year',
    label: 'This Year',
    getRange: now => ({ start: startOfYear(now), end: endOfYear(now) }),
  },
  {
    id: 'last-year',
    label: 'Last Year',
    getRange: now => {
      const day = subYears(now, 1);
      return { start: startOfYear(day), end: endOfYear(day) };
    },
  },
];
