import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  YEAR_PAGE_SIZE,
  clampDate,
  clampVisibleMonth,
  copyTime,
  getBounds,
  getYearPageStart,
  isDayDisabled,
  isDayUnavailable,
  isMonthDisabled,
  isValidDate,
  isYearDisabled,
  moveToMonth,
  revealMonth,
  withTime,
} from './dates';
import type { Bounds, DateRange, NavState, PickerConfig, PickerEvent, PickerState } from './types';

export interface InitialStateOptions {
  value?: Date | null;
  range?: DateRange | null;
  /** Month to show when nothing is selected. Defaults to config.now. */
  defaultMonth?: Date;
}

const panelCount = (config: PickerConfig) => Math.max(1, Math.floor(config.numberOfMonths || 1));

export const getPanelMonths = (state: PickerState, config: PickerConfig): Date[] =>
  Array.from({ length: panelCount(config) }, (_, i) => addMonths(state.visibleMonth, i));

/** Month the months/years view is currently editing. */
export const getViewMonth = (state: PickerState) => addMonths(state.visibleMonth, state.viewPanel);

const normalizeRange = (range: DateRange | null | undefined): DateRange => {
  let start = isValidDate(range?.start) ? startOfDay(range.start) : null;
  let end = isValidDate(range?.end) ? endOfDay(range.end) : null;
  if (start && end && isAfter(start, end)) {
    [start, end] = [startOfDay(end), endOfDay(start)];
  }
  if (!start && end) {
    start = startOfDay(end);
    end = null;
  }
  return { start, end };
};

const phaseFor = (range: DateRange): PickerState['rangePhase'] =>
  range.start && !range.end ? 'end' : 'start';

const isInWindow = (date: Date, visibleMonth: Date, n: number) => {
  const offset = differenceInCalendarMonths(date, visibleMonth);
  return offset >= 0 && offset < n;
};

/** Moves focus to `date` (clamped to bounds) and scrolls the window to show it. */
const focusAndReveal = (
  state: PickerState,
  date: Date,
  config: PickerConfig,
  bounds: Bounds,
): PickerState => {
  const n = panelCount(config);
  const focusedDate = startOfDay(clampDate(date, bounds));
  const visibleMonth = clampVisibleMonth(revealMonth(state.visibleMonth, focusedDate, n), bounds, n);
  return { ...state, focusedDate, visibleMonth };
};

/** Focuses `date`; if it is off screen, shows its month in the first panel. */
const jumpTo = (
  state: PickerState,
  date: Date,
  config: PickerConfig,
  bounds: Bounds,
): PickerState => {
  const focusedDate = startOfDay(clampDate(date, bounds));
  return isInWindow(focusedDate, state.visibleMonth, panelCount(config))
    ? { ...state, focusedDate }
    : showWindow(state, startOfMonth(focusedDate), focusedDate, config, bounds);
};

/** Sets a new window and keeps focus inside it. */
const showWindow = (
  state: PickerState,
  month: Date,
  preferredFocus: Date,
  config: PickerConfig,
  bounds: Bounds,
): PickerState => {
  const n = panelCount(config);
  const visibleMonth = clampVisibleMonth(month, bounds, n);
  let focusedDate = startOfDay(clampDate(preferredFocus, bounds));
  if (!isInWindow(focusedDate, visibleMonth, n)) {
    focusedDate = startOfDay(clampDate(visibleMonth, bounds));
  }
  return { ...state, visibleMonth, focusedDate };
};

export const createInitialState = (
  config: PickerConfig,
  { value, range, defaultMonth }: InitialStateOptions = {},
): PickerState => {
  const bounds = getBounds(config);
  const n = panelCount(config);
  const selected = isValidDate(value) ? value : null;
  const draft = normalizeRange(range);
  const anchor =
    (config.mode === 'single' ? selected : draft.start) ??
    (isValidDate(defaultMonth) ? defaultMonth : config.now);
  const focusedDate = startOfDay(clampDate(anchor, bounds));
  const visibleMonth = clampVisibleMonth(startOfMonth(focusedDate), bounds, n);

  return {
    open: false,
    view: 'days',
    viewPanel: 0,
    visibleMonth,
    yearPageStart: getYearPageStart(getYear(visibleMonth)),
    focusedDate,
    selected,
    range: draft,
    rangePhase: phaseFor(draft),
    hoverDate: null,
  };
};

export const getNavState = (state: PickerState, config: PickerConfig): NavState => {
  const { min, max } = getBounds(config);
  const disabled = Boolean(config.disabled);

  if (state.view === 'years') {
    return {
      unit: 'yearPage',
      canPrev: !disabled && (!min || getYear(min) < state.yearPageStart),
      canNext: !disabled && (!max || getYear(max) >= state.yearPageStart + YEAR_PAGE_SIZE),
    };
  }

  if (state.view === 'months') {
    const year = getYear(getViewMonth(state));
    return {
      unit: 'year',
      canPrev: !disabled && (!min || year - 1 >= getYear(min)),
      canNext: !disabled && (!max || year + 1 <= getYear(max)),
    };
  }

  const firstAfterWindow = addMonths(state.visibleMonth, panelCount(config));
  return {
    unit: 'month',
    canPrev: !disabled && (!min || !isBefore(endOfMonth(addMonths(state.visibleMonth, -1)), min)),
    canNext: !disabled && (!max || !isAfter(firstAfterWindow, max)),
  };
};

const navigate = (
  state: PickerState,
  direction: 1 | -1,
  config: PickerConfig,
  bounds: Bounds,
): PickerState => {
  const nav = getNavState(state, config);
  if (direction === -1 ? !nav.canPrev : !nav.canNext) return state;

  if (state.view === 'years') {
    return { ...state, yearPageStart: state.yearPageStart + direction * YEAR_PAGE_SIZE };
  }
  if (state.view === 'months') {
    return { ...state, visibleMonth: addYears(state.visibleMonth, direction) };
  }
  return showWindow(
    state,
    addMonths(state.visibleMonth, direction),
    addMonths(state.focusedDate, direction),
    config,
    bounds,
  );
};

const selectDay = (
  state: PickerState,
  date: Date,
  config: PickerConfig,
  bounds: Bounds,
): PickerState => {
  if (isDayDisabled(date, config, bounds) || isDayUnavailable(date, config)) return state;
  const day = startOfDay(date);
  const focused = focusAndReveal({ ...state, view: 'days', viewPanel: 0 }, day, config, bounds);

  if (config.mode === 'single') {
    const selected = config.showTime ? copyTime(day, state.selected) : day;
    const close = !config.showTime && config.closeOnSelect;
    return { ...focused, selected, open: close ? false : state.open };
  }

  const { start } = state.range;
  if (state.rangePhase === 'start' || !start) {
    return { ...focused, range: { start: day, end: null }, rangePhase: 'end', hoverDate: null };
  }
  const range = isBefore(day, start)
    ? { start: day, end: endOfDay(start) }
    : { start, end: endOfDay(day) };
  return { ...focused, range, rangePhase: 'start', hoverDate: null };
};

export const transition = (
  state: PickerState,
  event: PickerEvent,
  config: PickerConfig,
): PickerState => {
  const bounds = getBounds(config);
  const n = panelCount(config);

  switch (event.type) {
    case 'SET_VALUE': {
      const selected = isValidDate(event.value) ? event.value : null;
      if (selected === state.selected) return state;
      const next = { ...state, selected };
      return selected && !state.open ? jumpTo(next, selected, config, bounds) : next;
    }
    case 'SET_RANGE': {
      const range = normalizeRange(event.range);
      const next = { ...state, range, rangePhase: phaseFor(range), hoverDate: null };
      return range.start ? jumpTo(next, range.start, config, bounds) : next;
    }
    case 'CLOSE':
      return { ...state, open: false, view: 'days', viewPanel: 0, hoverDate: null };
    default:
      break;
  }

  if (config.disabled) return state;

  switch (event.type) {
    case 'OPEN': {
      if (state.open) return state;
      const anchor = config.mode === 'single' ? state.selected : state.range.start;
      const opened = { ...state, open: true, view: 'days' as const, viewPanel: 0, hoverDate: null };
      return jumpTo(opened, anchor ?? state.focusedDate, config, bounds);
    }
    case 'TOGGLE':
      return transition(state, { type: state.open ? 'CLOSE' : 'OPEN' }, config);

    case 'NAV_PREV':
      return navigate(state, -1, config, bounds);
    case 'NAV_NEXT':
      return navigate(state, 1, config, bounds);

    case 'SET_VIEW': {
      const viewPanel = Math.min(Math.max(event.panel ?? state.viewPanel, 0), n - 1);
      if (event.view === 'days') {
        return showWindow(
          { ...state, view: 'days', viewPanel: 0 },
          state.visibleMonth,
          state.focusedDate,
          config,
          bounds,
        );
      }
      const yearPageStart =
        event.view === 'years'
          ? getYearPageStart(getYear(addMonths(state.visibleMonth, viewPanel)))
          : state.yearPageStart;
      return { ...state, view: event.view, viewPanel, yearPageStart };
    }

    case 'SELECT_MONTH': {
      if (state.view !== 'months') return state;
      const target = new Date(getYear(getViewMonth(state)), event.month, 1);
      if (isMonthDisabled(target.getFullYear(), event.month, bounds)) return state;
      return showWindow(
        { ...state, view: 'days', viewPanel: 0 },
        addMonths(target, -state.viewPanel),
        moveToMonth(state.focusedDate, target.getFullYear(), event.month),
        config,
        bounds,
      );
    }

    case 'SELECT_YEAR': {
      if (state.view !== 'years' || isYearDisabled(event.year, bounds)) return state;
      const viewMonth = getViewMonth(state);
      return showWindow(
        { ...state, view: 'days', viewPanel: 0 },
        addMonths(new Date(event.year, viewMonth.getMonth(), 1), -state.viewPanel),
        moveToMonth(state.focusedDate, event.year, state.focusedDate.getMonth()),
        config,
        bounds,
      );
    }

    case 'SELECT_DAY':
      return selectDay(state, event.date, config, bounds);
    case 'SELECT_TODAY':
      return selectDay(state, config.now, config, bounds);

    case 'SELECT_TIME': {
      if (config.mode !== 'single' || !state.selected) return state;
      return { ...state, selected: withTime(state.selected, event.time) };
    }

    case 'HOVER_DAY': {
      if (config.mode !== 'range' || state.rangePhase !== 'end') {
        return state.hoverDate ? { ...state, hoverDate: null } : state;
      }
      const hoverDate =
        event.date && !isDayDisabled(event.date, config, bounds) ? startOfDay(event.date) : null;
      if (hoverDate === state.hoverDate) return state;
      if (hoverDate && state.hoverDate && isSameDay(hoverDate, state.hoverDate)) return state;
      return { ...state, hoverDate };
    }

    case 'FOCUS_DATE':
      return focusAndReveal(state, event.date, config, bounds);

    case 'MOVE_FOCUS':
    case 'FOCUS_WEEK_EDGE': {
      const from = state.focusedDate;
      let target: Date;
      if (event.type === 'FOCUS_WEEK_EDGE') {
        const opts = { weekStartsOn: config.weekStartsOn };
        target = event.edge === 'start' ? startOfWeek(from, opts) : endOfWeek(from, opts);
      } else {
        const move = { day: addDays, week: addWeeks, month: addMonths, year: addYears }[event.unit];
        target = move(from, event.amount);
      }
      const next = focusAndReveal(state, target, config, bounds);
      const previewing = config.mode === 'range' && state.rangePhase === 'end';
      return previewing ? { ...next, hoverDate: next.focusedDate } : next;
    }

    case 'CLEAR':
      return {
        ...state,
        selected: null,
        range: { start: null, end: null },
        rangePhase: 'start',
        hoverDate: null,
      };

    default:
      return state;
  }
};
