import { useEffect, useRef } from 'react';
import type { FocusEventHandler, ReactNode, Ref } from 'react';
import { createPortal } from 'react-dom';
import type { DatePickerApi } from '../hooks/useDatePicker';
import type { DateRangePickerApi } from '../hooks/useDateRangePicker';
import { CalendarIcon, ClearIcon } from './icons';

export const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(' ');

export interface FieldProps {
  placeholder?: string;
  className?: string;
  /** Class for the popover, which is portalled outside `className`'s subtree. */
  popoverClassName?: string;
  required?: boolean;
  invalid?: boolean;
  /** Show a clear button when there is a value. Default true. */
  clearable?: boolean;
  /** Render the popover in document.body. Default true. */
  portal?: boolean;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export const pickFieldProps = (props: FieldProps): FieldProps => ({
  className: props.className,
  popoverClassName: props.popoverClassName,
  required: props.required,
  invalid: props.invalid,
  clearable: props.clearable,
  portal: props.portal,
  onBlur: props.onBlur,
  'aria-label': props['aria-label'],
  'aria-labelledby': props['aria-labelledby'],
  'aria-describedby': props['aria-describedby'],
});

interface PickerShellProps extends FieldProps {
  api: DatePickerApi | DateRangePickerApi;
  inputRef: Ref<HTMLInputElement>;
  children: ReactNode;
}

/** Input, buttons and popover shared by both pickers. */
export const PickerShell = ({
  api,
  inputRef,
  children,
  placeholder,
  className,
  popoverClassName,
  required,
  invalid,
  clearable = true,
  portal = true,
  onBlur,
  ...aria
}: PickerShellProps) => {
  const hidden = api.getHiddenInputProps();
  const popover = (
    <>
      {api.isSheet && <div className='dp-backdrop' aria-hidden='true' />}
      <div className={cx('dp-popover', popoverClassName)} {...api.getDialogProps()}>
        {children}
      </div>
    </>
  );

  return (
    <div className={cx('dp-root', className)} data-invalid={invalid ? '' : undefined}>
      <div className='dp-field' {...api.getFieldProps()}>
        <input
          className='dp-input'
          {...api.getInputProps(inputRef)}
          value={api.inputValue}
          placeholder={placeholder}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          onBlur={onBlur}
          {...aria}
        />
        {clearable && (
          <button className='dp-icon-button dp-clear' {...api.getClearButtonProps()}>
            <ClearIcon />
          </button>
        )}
        <button className='dp-icon-button dp-trigger' {...api.getTriggerProps()}>
          <CalendarIcon />
        </button>
      </div>
      {hidden && <input {...hidden} />}
      {api.isOpen && (portal && typeof document !== 'undefined' ? createPortal(popover, document.body) : popover)}
    </div>
  );
};

export const TimeList = ({ api }: { api: DatePickerApi }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[data-selected]');
    if (list && selected) {
      list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.offsetHeight / 2;
      list.scrollLeft = selected.offsetLeft - list.clientWidth / 2 + selected.offsetWidth / 2;
    }
  }, [api.selectedTime]);

  return (
    <div className='dp-time'>
      <div className='dp-time-heading' aria-hidden='true'>
        {api.labels.time}
      </div>
      <div ref={listRef} className='dp-time-list' {...api.getTimeListProps()}>
        {api.timeOptions.map(option => (
          <button key={option.value} className='dp-time-option' {...api.getTimeOptionProps(option)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
