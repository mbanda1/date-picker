import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, InputHTMLAttributes, KeyboardEvent, MutableRefObject, Ref } from 'react';
import { format } from 'date-fns';
import { DEFAULT_LOCALE, createFormatters, getWeekStartsOn } from '../core';
import type { WeekDay } from '../core';
import { DEFAULT_LABELS } from './labels';
import type { PickerLabels } from './labels';
import type { DismissReason } from './usePickerPopover';
import type { ButtonProps, DivProps } from './useCalendar';
import { flag, mergeRefs } from './utils';
import type { DataAttributes } from './utils';

export interface BasePickerProps {
  minDate?: Date;
  maxDate?: Date;
  /** Extra per-day rule, e.g. weekends or holidays. */
  isDateUnavailable?: (date: Date) => boolean;
  disabled?: boolean;
  /** BCP 47 locale for month/day names. Defaults to "en-US". */
  locale?: string;
  /** Defaults to the locale's first day of the week. */
  weekStartsOn?: WeekDay;
  /** Fixed "current time"; pass it to make server and client render the same today. */
  now?: Date;
  /** Month to show when nothing is selected. */
  defaultMonth?: Date;
  /** date-fns format string or a formatter for the input text. */
  dateFormat?: string | ((date: Date) => string);
  labels?: Partial<PickerLabels>;
  /** Viewport width (px) below which the picker is a bottom sheet. null keeps the popover. */
  sheetBreakpoint?: number | null;
  /** Always render six weeks so the calendar height doesn't jump between months. */
  fixedWeeks?: boolean;
  dir?: 'ltr' | 'rtl';
  id?: string;
  onOpenChange?: (open: boolean) => void;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & DataAttributes & { ref?: Ref<HTMLInputElement> };

export const formatWith = (date: Date, dateFormat: BasePickerProps['dateFormat'], fallback: string) =>
  typeof dateFormat === 'function' ? dateFormat(date) : format(date, dateFormat ?? fallback);

export const useControllable = <T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) => {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const currentRef = useRef(current);
  currentRef.current = current;
  const commit = useCallback(
    (next: T) => {
      currentRef.current = next;
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [current, commit, currentRef] as const;
};

export const useBase = (props: BasePickerProps, defaultLabels?: Partial<PickerLabels>) => {
  const reactId = useId();
  const id = props.id ?? `dp${reactId.replace(/:/g, '')}`;
  const locale = props.locale ?? DEFAULT_LOCALE;
  const formatters = useMemo(() => createFormatters(locale), [locale]);
  const weekStartsOn = props.weekStartsOn ?? getWeekStartsOn(locale);
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...defaultLabels, ...props.labels }),
    [props.labels],
  );
  const [clock, setClock] = useState(() => props.now ?? new Date());
  const now = props.now ?? clock;
  const refreshNow = useCallback(() => {
    if (!props.now) setClock(new Date());
  }, [props.now]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  return { id, locale, formatters, weekStartsOn, labels, now, refreshNow, inputRef };
};

interface FieldPropsOptions {
  id: string;
  isOpen: boolean;
  disabled?: boolean;
  isSheet: boolean;
  labels: PickerLabels;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  open: () => void;
  close: (reason: DismissReason) => void;
  toggle: () => void;
  setReference: (el: HTMLElement | null) => void;
  setFloating: (el: HTMLElement | null) => void;
  popoverStyle: CSSProperties | undefined;
  dialogLabel: string;
  view: string;
}

/** Prop getters shared by both pickers for the field, trigger and popover. */
export const buildFieldProps = (o: FieldPropsOptions) => {
  const dialogId = `${o.id}-dialog`;
  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      o.open();
    } else if (e.key === 'Escape' && o.isOpen) {
      e.preventDefault();
      o.close('escape');
    }
  };
  return {
    getFieldProps: (): DivProps & { ref: (el: HTMLElement | null) => void } => ({
      ref: o.setReference,
      'data-open': flag(o.isOpen),
      'data-disabled': flag(o.disabled),
    }),
    getInputProps: (ref?: Ref<HTMLInputElement>): InputProps => ({
      ref: mergeRefs(o.inputRef, ref),
      id: o.id,
      type: 'text',
      readOnly: true,
      autoComplete: 'off',
      disabled: o.disabled,
      'aria-haspopup': 'dialog',
      'aria-expanded': o.isOpen,
      'aria-controls': o.isOpen ? dialogId : undefined,
      onClick: o.toggle,
      onKeyDown: onInputKeyDown,
    }),
    getTriggerProps: (): ButtonProps => ({
      type: 'button',
      'aria-label': o.labels.openCalendar,
      'aria-haspopup': 'dialog',
      'aria-expanded': o.isOpen,
      'aria-controls': o.isOpen ? dialogId : undefined,
      disabled: o.disabled,
      onClick: o.toggle,
    }),
    getDialogProps: (): DivProps & { ref: (el: HTMLElement | null) => void } => ({
      ref: o.setFloating,
      id: dialogId,
      role: 'dialog',
      'aria-label': o.dialogLabel,
      'aria-modal': o.isSheet ? true : undefined,
      style: o.popoverStyle,
      'data-layout': o.isSheet ? 'sheet' : 'popover',
      'data-view': o.view,
      onKeyDown: e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          o.close('escape');
        }
      },
    }),
  };
};

/** Returns focus to the input when the popover closes from inside. */
export const restoreFocus = (
  inputRef: MutableRefObject<HTMLInputElement | null>,
  floating: HTMLElement | null,
  reason: DismissReason,
) => {
  if (reason === 'outside' || typeof document === 'undefined') return;
  const active = document.activeElement;
  if (!active || active === document.body || floating?.contains(active)) {
    inputRef.current?.focus({ preventScroll: true });
  }
};
