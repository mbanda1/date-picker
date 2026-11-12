import { forwardRef } from 'react';
import { useDateRangePicker } from '../hooks/useDateRangePicker';
import type { UseDateRangePickerProps } from '../hooks/useDateRangePicker';
import { Calendar } from './Calendar';
import { PickerShell, pickFieldProps } from './parts';
import type { FieldProps } from './parts';

export interface DateRangePickerProps extends UseDateRangePickerProps, FieldProps {}

export const DateRangePicker = forwardRef<HTMLInputElement, DateRangePickerProps>(
  function DateRangePicker(props, ref) {
    const api = useDateRangePicker(props);

    return (
      <PickerShell
        api={api}
        inputRef={ref}
        {...pickFieldProps(props)}
        placeholder={props.placeholder ?? 'Select date range'}
      >
        <div className='dp-body'>
          {api.presets.length > 0 && (
            <div className='dp-presets' role='group' aria-label={api.labels.presets}>
              {api.presets.map(preset => (
                <button key={preset.id} className='dp-preset' {...api.getPresetProps(preset)}>
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <Calendar calendar={api.calendar} />
        </div>
        {!props.autoApply && (
          <div className='dp-footer'>
            <span className='dp-summary' aria-live='polite'>
              {api.draftLabel}
            </span>
            <div className='dp-actions'>
              <button className='dp-button' {...api.getCancelButtonProps()}>
                {api.labels.cancel}
              </button>
              <button className='dp-button dp-button-primary' {...api.getApplyButtonProps()}>
                {api.labels.apply}
              </button>
            </div>
          </div>
        )}
      </PickerShell>
    );
  },
);
