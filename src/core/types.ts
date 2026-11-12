export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PickerMode = 'single' | 'range';

export type CalendarView = 'days' | 'months' | 'years';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface Bounds {
  /** Start of the first selectable day. */
  min?: Date;
  /** Start of the last selectable day. */
  max?: Date;
}

export interface PickerConfig {
  mode: PickerMode;
  /** The current moment. Pass it in so server and client render the same "today". */
  now: Date;
  minDate?: Date;
  maxDate?: Date;
  weekStartsOn: WeekDay;
  /** Calendars shown side by side in the days view. */
  numberOfMonths: number;
  disabled?: boolean;
  /** Extra per-day rule, e.g. weekends or holidays. */
  isDateUnavailable?: (date: Date) => boolean;
  /** Single mode: picking a day keeps the picker open until a time is chosen. */
  showTime?: boolean;
  /** Single mode: close after a day is picked (ignored when showTime is on). */
  closeOnSelect?: boolean;
}

export interface PickerState {
  open: boolean;
  view: CalendarView;
  /** Which calendar (0-based) the months/years view was opened from. */
  viewPanel: number;
  /** First day of the month shown in panel 0. */
  visibleMonth: Date;
  /** First year of the 12-year page in the years view. */
  yearPageStart: number;
  /** Day that owns the roving tabindex in the grid. */
  focusedDate: Date;
  /** Single mode selection, including time when showTime is on. */
  selected: Date | null;
  /** Range mode draft selection. */
  range: DateRange;
  /** Range mode: which end the next click sets. */
  rangePhase: 'start' | 'end';
  hoverDate: Date | null;
}

export type PickerEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'NAV_PREV' }
  | { type: 'NAV_NEXT' }
  | { type: 'SET_VIEW'; view: CalendarView; panel?: number }
  | { type: 'SELECT_MONTH'; month: number }
  | { type: 'SELECT_YEAR'; year: number }
  | { type: 'SELECT_DAY'; date: Date }
  | { type: 'SELECT_TODAY' }
  | { type: 'SELECT_TIME'; time: string }
  | { type: 'HOVER_DAY'; date: Date | null }
  | { type: 'FOCUS_DATE'; date: Date }
  | { type: 'MOVE_FOCUS'; unit: 'day' | 'week' | 'month' | 'year'; amount: number }
  | { type: 'FOCUS_WEEK_EDGE'; edge: 'start' | 'end' }
  | { type: 'SET_VALUE'; value: Date | null }
  | { type: 'SET_RANGE'; range: DateRange }
  | { type: 'CLEAR' };

export interface DayCell {
  date: Date;
  /** Day belongs to a neighbouring month (leading/trailing cell). */
  isOutsideMonth: boolean;
  isToday: boolean;
  isFocused: boolean;
  isDisabled: boolean;
  isUnavailable: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  /** Inside the committed draft range or the hover preview, endpoints included. */
  isInRange: boolean;
  /** isInRange comes from hovering, not a finished range. */
  isPreview: boolean;
}

export interface MonthCell {
  month: number;
  year: number;
  isCurrent: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface YearCell {
  year: number;
  isCurrent: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface NavState {
  unit: 'month' | 'year' | 'yearPage';
  canPrev: boolean;
  canNext: boolean;
}
