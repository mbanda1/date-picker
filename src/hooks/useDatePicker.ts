import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { format } from 'date-fns';
import { getTimeOptions, isDayDisabled, toTimeValue } from '../core';
import type { PickerConfig, PickerEvent, PickerState, TimeOption } from '../core';
import { buildFieldProps, formatWith, restoreFocus, useBase, useControllable } from './shared';
import type { BasePickerProps } from './shared';
import { useCalendar } from './useCalendar';
import type { ButtonProps, CalendarApi, DivProps } from './useCalendar';
import { usePickerMachine } from './usePickerMachine';
import { usePickerPopover, useSheetLayout } from './usePickerPopover';
import type { DismissReason } from './usePickerPopover';
import { flag } from './utils';

export interface UseDatePickerProps extends BasePickerProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  /** Show a time list next to the calendar. */
  showTime?: boolean;
  /** Minutes between time options. */
  timeInterval?: number;
  /** "HH:mm" */
  minTime?: string;
  /** "HH:mm" */
  maxTime?: string;
  /** Force 12- or 24-hour time labels; defaults to the locale. */
  hour12?: boolean;
  /** Close after a day is picked (ignored with showTime). Default true. */
  closeOnSelect?: boolean;
  /** Renders a hidden input with an ISO value for native form posts. */
  name?: string;
}

export const useDatePicker = (props: UseDatePickerProps) => {
  const {
    minDate,
    maxDate,
    isDateUnavailable,
    disabled = false,
    showTime = false,
    timeInterval = 30,
    minTime,
    maxTime,
    hour12,
    closeOnSelect = true,
    dateFormat,
    sheetBreakpoint = 640,
    dir = 'ltr',
    name,
    onOpenChange,
  } = props;

  const base = useBase(props);
  const [value, commit, valueRef] = useControllable(props.value, props.defaultValue ?? null, props.onChange);
  const isSheet = useSheetLayout(sheetBreakpoint);

  const config = useMemo<PickerConfig>(
    () => ({
      mode: 'single',
      now: base.now,
      minDate,
      maxDate,
      isDateUnavailable,
      weekStartsOn: base.weekStartsOn,
      numberOfMonths: 1,
      disabled,
      showTime,
      closeOnSelect,
    }),
    [base.now, minDate, maxDate, isDateUnavailable, base.weekStartsOn, disabled, showTime, closeOnSelect],
  );

  const { state, stateRef, send } = usePickerMachine(config, () => ({
    value,
    defaultMonth: props.defaultMonth,
  }));
  const [timeTouched, setTimeTouched] = useState(false);

  const valueTime = value?.getTime() ?? null;
  useEffect(() => {
    send({ type: 'SET_VALUE', value: valueRef.current });
  }, [valueTime, send, valueRef]);

  const popover = usePickerPopover({
    open: state.open,
    isSheet,
    onDismiss: reason => close(reason),
  });

  const close = useCallback(
    (reason: DismissReason) => {
      if (!stateRef.current.open) return;
      restoreFocus(base.inputRef, popover.floatingRef.current, reason);
      send({ type: 'CLOSE' });
      onOpenChange?.(false);
    },
    [stateRef, send, base.inputRef, popover.floatingRef, onOpenChange],
  );

  const afterSelect = useCallback(
    (prev: PickerState, next: PickerState) => {
      if (prev.open && !next.open) {
        restoreFocus(base.inputRef, popover.floatingRef.current, 'select');
        onOpenChange?.(false);
      }
    },
    [base.inputRef, popover.floatingRef, onOpenChange],
  );

  const selectDay = useCallback(
    (date: Date) => {
      const prev = stateRef.current;
      const next = send({ type: 'SELECT_DAY', date });
      if (next === prev || !next.selected) return;
      if (!showTime || valueRef.current) commit(next.selected);
      afterSelect(prev, next);
    },
    [stateRef, send, showTime, valueRef, commit, afterSelect],
  );

  const { api: calendar, focusDayOnNextRender } = useCalendar({
    id: base.id,
    state,
    config,
    send,
    selectDay,
    close,
    formatters: base.formatters,
    labels: base.labels,
    dir,
    floatingRef: popover.floatingRef,
    fixedWeeks: props.fixedWeeks,
  });

  const open = useCallback(() => {
    if (disabled || stateRef.current.open) return;
    base.refreshNow();
    setTimeTouched(false);
    focusDayOnNextRender();
    send({ type: 'SET_VALUE', value: valueRef.current }, { type: 'OPEN' });
    onOpenChange?.(true);
  }, [disabled, stateRef, base, focusDayOnNextRender, send, valueRef, onOpenChange]);

  const toggle = useCallback(() => {
    if (stateRef.current.open) close('trigger');
    else open();
  }, [stateRef, close, open]);

  const selectTime = useCallback(
    (time: string) => {
      const next = send({ type: 'SELECT_TIME', time });
      setTimeTouched(true);
      if (next.selected) commit(next.selected);
    },
    [send, commit],
  );

  const clear = useCallback(() => {
    send({ type: 'CLEAR' });
    commit(null);
    base.inputRef.current?.focus();
  }, [send, commit, base.inputRef]);

  const timeOptions = useMemo<TimeOption[]>(
    () =>
      showTime
        ? getTimeOptions({ minTime, maxTime, interval: timeInterval, locale: base.locale, hour12 })
        : [],
    [showTime, minTime, maxTime, timeInterval, base.locale, hour12],
  );
  const selectedTime = state.selected && (timeTouched || value) ? toTimeValue(state.selected) : null;
  const todayDisabled =
    disabled || isDayDisabled(base.now, config) || Boolean(isDateUnavailable?.(base.now));

  const inputValue = value ? formatWith(value, dateFormat, showTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : '';

  const field = buildFieldProps({
    id: base.id,
    isOpen: state.open,
    disabled,
    isSheet,
    labels: base.labels,
    inputRef: base.inputRef,
    open,
    close,
    toggle,
    setReference: popover.setReference,
    setFloating: popover.setFloating,
    popoverStyle: popover.style,
    dialogLabel: base.labels.dialog,
    view: state.view,
  });

  return {
    value,
    inputValue,
    isOpen: state.open,
    isSheet,
    labels: base.labels,
    state,
    /** Low-level escape hatch: dispatch a core event without commit side effects. */
    send: send as (...events: PickerEvent[]) => PickerState,
    calendar: calendar as CalendarApi,
    open,
    close,
    toggle,
    clear,
    selectDay,
    selectTime,
    showTimeList: showTime && Boolean(state.selected) && state.view === 'days',
    timeOptions,
    selectedTime,
    ...field,
    getClearButtonProps: (): ButtonProps => ({
      type: 'button',
      'aria-label': base.labels.clear,
      disabled,
      hidden: !value || disabled,
      onClick: clear,
    }),
    getTodayButtonProps: (): ButtonProps => ({
      type: 'button',
      disabled: todayDisabled,
      onClick: () => selectDay(base.now),
    }),
    getTimeListProps: (): DivProps => ({ role: 'listbox', 'aria-label': base.labels.time }),
    getTimeOptionProps: (option: TimeOption): ButtonProps => ({
      type: 'button',
      role: 'option',
      'aria-selected': option.value === selectedTime,
      'data-selected': flag(option.value === selectedTime),
      'data-time': option.value,
      disabled,
      onClick: () => selectTime(option.value),
    }),
    getHiddenInputProps: (): InputHTMLAttributes<HTMLInputElement> | null =>
      name
        ? {
            type: 'hidden',
            name,
            value: value ? format(value, showTime ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd') : '',
          }
        : null,
  };
};

export type DatePickerApi = ReturnType<typeof useDatePicker>;
