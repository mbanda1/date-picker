import {
  addDays,
  endOfMonth,
  endOfWeek,
  getYear,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  YEAR_PAGE_SIZE,
  getBounds,
  isDayDisabled,
  isDayUnavailable,
  isMonthDisabled,
  isYearDisabled,
} from './dates';
import { getViewMonth } from './state';
import type { DayCell, MonthCell, PickerConfig, PickerState, WeekDay, YearCell } from './types';

const WEEKS_IN_FIXED_GRID = 6;

/** Whole weeks covering `month`, optionally padded to 6 rows for a stable height. */
export const getMonthGrid = (
  month: Date,
  weekStartsOn: WeekDay = 0,
  fixedWeeks = false,
): Date[][] => {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn });
  const weeks: Date[][] = [];
  for (let day = first; !isAfter(day, last) || (fixedWeeks && weeks.length < WEEKS_IN_FIXED_GRID); ) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(day, i));
    weeks.push(week);
    day = addDays(day, 7);
  }
  return weeks;
};

const dayValue = (date: Date) => startOfDay(date).getTime();

/** Visible span of the range, including the hover preview. */
const getHighlightedSpan = (state: PickerState): { lo: number; hi: number; preview: boolean } | null => {
  const { start, end } = state.range;
  if (!start) return null;
  if (end) return { lo: dayValue(start), hi: dayValue(end), preview: false };
  if (state.rangePhase === 'end' && state.hoverDate) {
    const a = dayValue(start);
    const b = dayValue(state.hoverDate);
    return { lo: Math.min(a, b), hi: Math.max(a, b), preview: true };
  }
  return { lo: dayValue(start), hi: dayValue(start), preview: false };
};

export const getDayCells = (
  panelMonth: Date,
  state: PickerState,
  config: PickerConfig,
  { fixedWeeks = false }: { fixedWeeks?: boolean } = {},
): DayCell[][] => {
  const bounds = getBounds(config);
  const span = config.mode === 'range' ? getHighlightedSpan(state) : null;
  const { start, end } = state.range;

  return getMonthGrid(panelMonth, config.weekStartsOn, fixedWeeks).map(week =>
    week.map(date => {
      const value = dayValue(date);
      const isOutsideMonth = !isSameMonth(date, panelMonth);
      const isInRange = Boolean(span && value >= span.lo && value <= span.hi);
      const isSelected =
        config.mode === 'single'
          ? Boolean(state.selected && isSameDay(date, state.selected))
          : Boolean((start && isSameDay(date, start)) || (end && isSameDay(date, end)));
      return {
        date,
        isOutsideMonth,
        isToday: isSameDay(date, config.now),
        isFocused: !isOutsideMonth && isSameDay(date, state.focusedDate),
        isDisabled: isDayDisabled(date, config, bounds),
        isUnavailable: isDayUnavailable(date, config),
        isSelected,
        isRangeStart: Boolean(span && value === span.lo),
        isRangeEnd: Boolean(span && value === span.hi),
        isInRange,
        isPreview: Boolean(span?.preview && isInRange),
      };
    }),
  );
};

export const getMonthCells = (state: PickerState, config: PickerConfig): MonthCell[] => {
  const bounds = getBounds(config);
  const viewMonth = getViewMonth(state);
  const year = getYear(viewMonth);
  return Array.from({ length: 12 }, (_, month) => ({
    month,
    year,
    isCurrent: year === getYear(config.now) && month === config.now.getMonth(),
    isSelected: month === viewMonth.getMonth(),
    isDisabled: Boolean(config.disabled) || isMonthDisabled(year, month, bounds),
  }));
};

export const getYearCells = (state: PickerState, config: PickerConfig): YearCell[] => {
  const bounds = getBounds(config);
  const viewYear = getYear(getViewMonth(state));
  return Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => {
    const year = state.yearPageStart + i;
    return {
      year,
      isCurrent: year === getYear(config.now),
      isSelected: year === viewYear,
      isDisabled: Boolean(config.disabled) || isYearDisabled(year, bounds),
    };
  });
};

/** True when the range is complete and every day in it is selectable. */
export const isRangeSelectable = (state: PickerState, config: PickerConfig): boolean => {
  const { start, end } = state.range;
  if (!start || !end) return false;
  const bounds = getBounds(config);
  if (isDayDisabled(start, config, bounds) || isDayDisabled(end, config, bounds)) return false;
  if (!config.isDateUnavailable) return true;
  for (let d = startOfDay(start); !isAfter(d, end); d = addDays(d, 1)) {
    if (isDayUnavailable(d, config)) return false;
  }
  return true;
};
