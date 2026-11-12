import { forwardRef } from 'react';
import { useDatePicker } from '../hooks/useDatePicker';
import type { UseDatePickerProps } from '../hooks/useDatePicker';
import { Calendar } from './Calendar';
import { PickerShell, TimeList, pickFieldProps } from './parts';
import type { FieldProps } from './parts';

export interface DatePickerProps extends UseDatePickerProps, FieldProps {
  /** Show a "Today" button under the calendar. Default true. */
  showTodayButton?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(props, ref) {
  const api = useDatePicker(props);
  const { showTodayButton = true } = props;

  return (
    <PickerShell api={api} inputRef={ref} {...pickFieldProps(props)} placeholder={props.placeholder ?? 'Select date'}>
      <div className='dp-body'>
        <Calendar calendar={api.calendar} />
        {api.showTimeList && <TimeList api={api} />}
      </div>
      {showTodayButton && api.isOpen && (
        <div className='dp-footer'>
          <button className='dp-button dp-today' {...api.getTodayButtonProps()}>
            {api.labels.today}
          </button>
        </div>
      )}
    </PickerShell>
  );
});
