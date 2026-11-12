import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
} from 'react';
import {
  YEAR_PAGE_SIZE,
  getDayCells,
  getGridKeyEvent,
  getMonthCells,
  getNavState,
  getPanelMonths,
  getWeekdayNames,
  getYearCells,
  toDateKey,
} from '../core';
import type {
  CalendarView,
  DayCell,
  Formatters,
  MonthCell,
  NavState,
  PickerConfig,
  PickerEvent,
  PickerState,
  WeekdayName,
  YearCell,
} from '../core';
import type { PickerLabels } from './labels';
import type { DismissReason } from './usePickerPopover';
import { dateFromEvent, flag } from './utils';
import type { DataAttributes } from './utils';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & DataAttributes;
export type DivProps = HTMLAttributes<HTMLDivElement> & DataAttributes;

export interface DayItem extends DayCell {
  label: string;
}
export interface MonthItem extends MonthCell {
  label: string;
}
export interface YearItem extends YearCell {
  label: string;
}

export interface CalendarPanel {
  index: number;
  month: Date;
  title: string;
  titleId: string;
  weeks: DayItem[][];
}

export interface CalendarApi {
  view: CalendarView;
  nav: NavState;
  /** Panels to render in the days view (one per visible month). Empty while the picker is closed. */
  panels: CalendarPanel[];
  weekdays: WeekdayName[];
  /** Filled in the months view while open. */
  months: MonthItem[];
  /** Filled in the years view while open. */
  years: YearItem[];
  /** Heading for the months/years view. */
  viewTitle: string;
  getPrevButtonProps: () => ButtonProps;
  getNextButtonProps: () => ButtonProps;
  /** Heading button; in the days view pass the panel index it belongs to. */
  getTitleButtonProps: (panelIndex?: number) => ButtonProps;
  getGridProps: (panelIndex: number) => DivProps;
  getDayCellProps: (cell: DayCell) => DivProps;
  getDayProps: (cell: DayCell) => ButtonProps;
  getMonthProps: (cell: MonthCell) => ButtonProps;
  getYearProps: (cell: YearCell) => ButtonProps;
}

interface UseCalendarOptions {
  id: string;
  state: PickerState;
  config: PickerConfig;
  send: (...events: PickerEvent[]) => PickerState;
  selectDay: (date: Date) => void;
  close: (reason: DismissReason) => void;
  formatters: Formatters;
  labels: PickerLabels;
  dir?: 'ltr' | 'rtl';
  floatingRef: MutableRefObject<HTMLElement | null>;
  fixedWeeks?: boolean;
}

type FocusTarget = 'day' | 'view-cell';

const dayData = (cell: DayCell): DataAttributes => ({
  'data-today': flag(cell.isToday),
  'data-selected': flag(cell.isSelected),
  'data-range-start': flag(cell.isRangeStart),
  'data-range-end': flag(cell.isRangeEnd),
  'data-in-range': flag(cell.isInRange),
  'data-preview': flag(cell.isPreview),
  'data-disabled': flag(cell.isDisabled || cell.isUnavailable),
  'data-unavailable': flag(cell.isUnavailable),
  'data-outside-month': flag(cell.isOutsideMonth),
});

export const useCalendar = ({
  id,
  state,
  config,
  send,
  selectDay,
  close,
  formatters,
  labels,
  dir,
  floatingRef,
  fixedWeeks,
}: UseCalendarOptions) => {
  const pendingFocus = useRef<FocusTarget | null>(null);

  useEffect(() => {
    const target = pendingFocus.current;
    const root = floatingRef.current;
    if (!target || !state.open || !root) return;
    pendingFocus.current = null;
    const el =
      target === 'day'
        ? root.querySelector('[role="grid"] [tabindex="0"]')
        : (root.querySelector('[data-view-cell][data-selected]:not([aria-disabled])') ??
          root.querySelector('[data-view-cell]:not([aria-disabled])'));
    (el as HTMLElement | null)?.focus({ preventScroll: true });
  });

  const weekdays = useMemo(
    () => getWeekdayNames(formatters.locale, config.weekStartsOn),
    [formatters.locale, config.weekStartsOn],
  );

  const content = useMemo(() => {
    const titleId = (i: number) => `${id}-title-${i}`;
    const nav = getNavState(state, config);
    const panelMonths = getPanelMonths(state, config);
    const showDays = state.open && state.view === 'days';

    const panels: CalendarPanel[] = state.open
      ? panelMonths.map((month, index) => ({
          index,
          month,
          title: formatters.monthYear(month),
          titleId: titleId(index),
          weeks: showDays
            ? getDayCells(month, state, config, { fixedWeeks }).map(week =>
                week.map(cell => ({ ...cell, label: formatters.day(cell.date) })),
              )
            : [],
        }))
      : [];

    const months =
      state.open && state.view === 'months'
        ? getMonthCells(state, config).map(cell => ({ ...cell, label: formatters.monthNames[cell.month] }))
        : [];
    const years =
      state.open && state.view === 'years'
        ? getYearCells(state, config).map(cell => ({
            ...cell,
            label: formatters.year(new Date(cell.year, 0, 1)),
          }))
        : [];

    const viewMonth = panelMonths[state.viewPanel] ?? state.visibleMonth;
    const viewTitle = !state.open
      ? ''
      : state.view === 'years'
        ? `${formatters.year(new Date(state.yearPageStart, 0, 1))} – ${formatters.year(
            new Date(state.yearPageStart + YEAR_PAGE_SIZE - 1, 0, 1),
          )}`
        : formatters.year(viewMonth);

    return { titleId, nav, panels, months, years, viewTitle };
  }, [id, state, config, formatters, fixedWeeks]);

  const api = useMemo((): CalendarApi => {
    const { titleId, nav, panels, months, years, viewTitle } = content;
    const run = (event: PickerEvent, focus?: FocusTarget) => {
      if (focus) pendingFocus.current = focus;
      send(event);
    };

    const navLabels = {
      month: [labels.previousMonth, labels.nextMonth],
      year: [labels.previousYear, labels.nextYear],
      yearPage: [labels.previousYears, labels.nextYears],
    }[nav.unit];

    return {
      view: state.view,
      nav,
      panels,
      weekdays,
      months,
      years,
      viewTitle,

      getPrevButtonProps: () => ({
        type: 'button',
        'aria-label': navLabels[0],
        disabled: !nav.canPrev,
        onClick: () => run({ type: 'NAV_PREV' }),
      }),
      getNextButtonProps: () => ({
        type: 'button',
        'aria-label': navLabels[1],
        disabled: !nav.canNext,
        onClick: () => run({ type: 'NAV_NEXT' }),
      }),

      getTitleButtonProps: (panelIndex = 0) => {
        if (state.view === 'days') {
          return {
            type: 'button',
            'aria-label': `${panels[panelIndex]?.title ?? ''}, ${labels.chooseMonth}`,
            disabled: config.disabled,
            onClick: () => run({ type: 'SET_VIEW', view: 'months', panel: panelIndex }, 'view-cell'),
          };
        }
        if (state.view === 'months') {
          return {
            type: 'button',
            'aria-label': `${viewTitle}, ${labels.chooseYear}`,
            disabled: config.disabled,
            onClick: () => run({ type: 'SET_VIEW', view: 'years' }, 'view-cell'),
          };
        }
        return {
          type: 'button',
          'aria-label': labels.backToCalendar,
          disabled: config.disabled,
          onClick: () => run({ type: 'SET_VIEW', view: 'days' }, 'day'),
        };
      },

      getGridProps: panelIndex => ({
        role: 'grid',
        'aria-labelledby': titleId(panelIndex),
        'aria-multiselectable': config.mode === 'range' ? true : undefined,
        onClick: (e: MouseEvent<HTMLDivElement>) => {
          const date = dateFromEvent(e.target, e.currentTarget);
          if (date) selectDay(date);
        },
        onMouseOver: (e: MouseEvent<HTMLDivElement>) => {
          if (config.mode !== 'range') return;
          const date = dateFromEvent(e.target, e.currentTarget);
          if (date) send({ type: 'HOVER_DAY', date });
        },
        onMouseLeave: () => {
          if (config.mode === 'range') send({ type: 'HOVER_DAY', date: null });
        },
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          const rtl = dir ? dir === 'rtl' : getComputedStyle(e.currentTarget).direction === 'rtl';
          const event = getGridKeyEvent({ key: e.key, shiftKey: e.shiftKey }, state, { rtl });
          if (!event) return;
          e.preventDefault();
          if (event.type === 'SELECT_DAY') {
            pendingFocus.current = 'day';
            selectDay(event.date);
          } else if (event.type === 'CLOSE') {
            close('escape');
          } else {
            run(event, 'day');
          }
        },
      }),

      getDayCellProps: cell => ({
        role: 'gridcell',
        'aria-selected': cell.isOutsideMonth
          ? undefined
          : cell.isSelected || (cell.isInRange && !cell.isPreview),
        ...dayData(cell),
      }),

      getDayProps: cell => ({
        type: 'button',
        tabIndex: cell.isFocused ? 0 : -1,
        'data-date': toDateKey(cell.date),
        'aria-label': formatters.fullDate(cell.date),
        'aria-disabled': cell.isDisabled || cell.isUnavailable || undefined,
        'aria-current': cell.isToday ? 'date' : undefined,
        ...dayData(cell),
      }),

      getMonthProps: cell => ({
        type: 'button',
        'data-view-cell': '',
        'data-current': flag(cell.isCurrent),
        'data-selected': flag(cell.isSelected),
        'data-disabled': flag(cell.isDisabled),
        'aria-pressed': cell.isSelected,
        'aria-disabled': cell.isDisabled || undefined,
        onClick: () => {
          if (!cell.isDisabled) run({ type: 'SELECT_MONTH', month: cell.month }, 'day');
        },
      }),

      getYearProps: cell => ({
        type: 'button',
        'data-view-cell': '',
        'data-current': flag(cell.isCurrent),
        'data-selected': flag(cell.isSelected),
        'data-disabled': flag(cell.isDisabled),
        'aria-pressed': cell.isSelected,
        'aria-disabled': cell.isDisabled || undefined,
        onClick: () => {
          if (!cell.isDisabled) run({ type: 'SELECT_YEAR', year: cell.year }, 'day');
        },
      }),
    };
  }, [content, state, config, send, selectDay, close, formatters, labels, dir, weekdays]);

  const focusDayOnNextRender = useCallback(() => {
    pendingFocus.current = 'day';
  }, []);

  return { api, focusDayOnNextRender };
};
