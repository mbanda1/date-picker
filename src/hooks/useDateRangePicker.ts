import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { format, isSameDay } from 'date-fns';
import { DEFAULT_RANGE_PRESETS, isRangeSelectable } from '../core';
import type { DateRange, PickerConfig, PickerEvent, PickerState, RangePreset } from '../core';
import { buildFieldProps, formatWith, restoreFocus, useBase, useControllable } from './shared';
import type { BasePickerProps } from './shared';
import { useCalendar } from './useCalendar';
import type { ButtonProps, CalendarApi } from './useCalendar';
import { usePickerMachine } from './usePickerMachine';
import { usePickerPopover, useSheetLayout } from './usePickerPopover';
import type { DismissReason } from './usePickerPopover';
import { flag } from './utils';

export interface UseDateRangePickerProps extends BasePickerProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** Months side by side on wide screens. Default 2; the sheet layout always shows 1. */
  numberOfMonths?: number;
  /** true for the built-in presets, or your own list. */
  presets?: boolean | RangePreset[];
  /** Commit and close as soon as both ends are picked, without an Apply step. */
  autoApply?: boolean;
  /** Disable Apply, e.g. while the parent is loading. */
  applyDisabled?: boolean;
  /** Text between the two dates in the input. Default " - ". */
  separator?: string;
  /** Renders a hidden input with an ISO interval ("2025-03-01/2025-03-31"). */
  name?: string;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };
const RANGE_LABELS = { dialog: 'Choose date range' };

const sameRangeDays = (a: DateRange, b: DateRange) =>
  Boolean(a.start && a.end && b.start && b.end && isSameDay(a.start, b.start) && isSameDay(a.end, b.end));

export const useDateRangePicker = (props: UseDateRangePickerProps) => {
  const {
    minDate,
    maxDate,
    isDateUnavailable,
    disabled = false,
    numberOfMonths = 2,
    autoApply = false,
    applyDisabled = false,
    separator = ' - ',
    dateFormat,
    sheetBreakpoint = 640,
    dir,
    name,
    onOpenChange,
  } = props;

  const base = useBase(props, RANGE_LABELS);
  const [value, commit, valueRef] = useControllable(props.value, props.defaultValue ?? EMPTY_RANGE, props.onChange);
  const isSheet = useSheetLayout(sheetBreakpoint);

  const config = useMemo<PickerConfig>(
    () => ({
      mode: 'range',
      now: base.now,
      minDate,
      maxDate,
      isDateUnavailable,
      weekStartsOn: base.weekStartsOn,
      numberOfMonths: isSheet ? 1 : Math.max(1, numberOfMonths),
      disabled,
    }),
    [base.now, minDate, maxDate, isDateUnavailable, base.weekStartsOn, isSheet, numberOfMonths, disabled],
  );

  const { state, stateRef, send } = usePickerMachine(config, () => ({
    range: value,
    defaultMonth: props.defaultMonth,
  }));

  const startTime = value.start?.getTime() ?? null;
  const endTime = value.end?.getTime() ?? null;
  useEffect(() => {
    send({ type: 'SET_RANGE', range: valueRef.current });
  }, [startTime, endTime, send, valueRef]);

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

  const commitIfComplete = useCallback(
    (next: PickerState) => {
      if (!autoApply || applyDisabled || !isRangeSelectable(next, config)) return;
      commit(next.range);
      close('apply');
    },
    [autoApply, applyDisabled, config, commit, close],
  );

  const selectDay = useCallback(
    (date: Date) => commitIfComplete(send({ type: 'SELECT_DAY', date })),
    [send, commitIfComplete],
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
    focusDayOnNextRender();
    send({ type: 'SET_RANGE', range: valueRef.current }, { type: 'OPEN' });
    onOpenChange?.(true);
  }, [disabled, stateRef, base, focusDayOnNextRender, send, valueRef, onOpenChange]);

  const toggle = useCallback(() => {
    if (stateRef.current.open) close('trigger');
    else open();
  }, [stateRef, close, open]);

  const canApply = !applyDisabled && isRangeSelectable(state, config);

  const apply = useCallback(() => {
    if (applyDisabled || !isRangeSelectable(stateRef.current, config)) return;
    commit(stateRef.current.range);
    close('apply');
  }, [applyDisabled, stateRef, config, commit, close]);

  const clear = useCallback(() => {
    send({ type: 'CLEAR' });
    commit(EMPTY_RANGE);
    base.inputRef.current?.focus();
  }, [send, commit, base.inputRef]);

  const presets = useMemo(
    () => (props.presets === true ? DEFAULT_RANGE_PRESETS : props.presets || []),
    [props.presets],
  );
  const presetRanges = useMemo(
    () => presets.map(preset => ({ preset, range: preset.getRange(base.now, { weekStartsOn: base.weekStartsOn }) })),
    [presets, base.now, base.weekStartsOn],
  );
  const [clickedPresetId, setClickedPresetId] = useState<string | null>(null);
  const matching = presetRanges.filter(p => sameRangeDays(p.range, state.range)).map(p => p.preset.id);
  const activePresetId =
    clickedPresetId && matching.includes(clickedPresetId) ? clickedPresetId : (matching[0] ?? null);

  const selectPreset = useCallback(
    (preset: RangePreset) => {
      const range = preset.getRange(base.now, { weekStartsOn: base.weekStartsOn });
      setClickedPresetId(preset.id);
      commitIfComplete(send({ type: 'SET_RANGE', range }));
    },
    [base.now, base.weekStartsOn, send, commitIfComplete],
  );

  const fmt = (date: Date) => formatWith(date, dateFormat, 'yyyy MMM d');
  const describe = (range: DateRange) =>
    range.start ? (range.end ? `${fmt(range.start)}${separator}${fmt(range.end)}` : fmt(range.start)) : '';

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
    onPopoverKeyDown: popover.onKeyDown,
    dialogLabel: base.labels.dialog,
    view: state.view,
    dir,
  });

  const hasValue = Boolean(value.start || value.end);

  return {
    value,
    inputValue: describe(value),
    /** Text for the in-progress selection, e.g. in a footer. */
    draftLabel: describe(state.range),
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
    apply,
    canApply,
    selectDay,
    selectPreset,
    presets,
    activePresetId,
    ...field,
    getClearButtonProps: (): ButtonProps => ({
      type: 'button',
      'aria-label': base.labels.clear,
      disabled,
      hidden: !hasValue || disabled,
      onClick: clear,
    }),
    getPresetProps: (preset: RangePreset): ButtonProps => ({
      type: 'button',
      'aria-pressed': preset.id === activePresetId,
      'data-active': flag(preset.id === activePresetId),
      disabled,
      onClick: () => selectPreset(preset),
    }),
    getApplyButtonProps: (): ButtonProps => ({ type: 'button', disabled: !canApply, onClick: apply }),
    getCancelButtonProps: (): ButtonProps => ({ type: 'button', onClick: () => close('cancel') }),
    getHiddenInputProps: (): InputHTMLAttributes<HTMLInputElement> | null =>
      name
        ? {
            type: 'hidden',
            name,
            value:
              value.start && value.end
                ? `${format(value.start, 'yyyy-MM-dd')}/${format(value.end, 'yyyy-MM-dd')}`
                : '',
          }
        : null,
  };
};

export type DateRangePickerApi = ReturnType<typeof useDateRangePicker>;
