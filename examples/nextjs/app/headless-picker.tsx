'use client';

import { useState } from 'react';
import { useDatePicker } from '@mbanda1/date-picker/headless';

/** Fully custom markup from the headless hook; none of the default classes are used. */
export function HeadlessPicker() {
  const [value, setValue] = useState<Date | null>(null);
  const picker = useDatePicker({ value, onChange: setValue, id: 'headless', dateFormat: 'MMMM d, yyyy' });
  const { calendar } = picker;

  return (
    <section>
      <h2>Headless hook</h2>
      <p className='muted'>
        <code>useDatePicker</code> from <code>@mbanda1/date-picker/headless</code> with hand-written markup and styles.
      </p>
      <label htmlFor='headless'>Custom markup</label>
      <div className='hl-field' {...picker.getFieldProps()}>
        <input className='hl-input' {...picker.getInputProps()} value={picker.inputValue} placeholder='Select…' />
        <button className='hl-icon' {...picker.getTriggerProps()}>
          ▾
        </button>
      </div>

      {picker.isOpen && (
        <div className='hl-popover' {...picker.getDialogProps()}>
          {calendar.view === 'days' ? (
            calendar.panels.map(panel => (
              <div key={panel.index}>
                <div className='hl-header'>
                  <button className='hl-icon' {...calendar.getPrevButtonProps()}>
                    ‹
                  </button>
                  <button className='hl-title' {...calendar.getTitleButtonProps(panel.index)}>
                    <span id={panel.titleId}>{panel.title}</span>
                  </button>
                  <button className='hl-icon' {...calendar.getNextButtonProps()}>
                    ›
                  </button>
                </div>
                <div {...calendar.getGridProps(panel.index)}>
                  <div role='row' className='hl-row'>
                    {calendar.weekdays.map(d => (
                      <span key={d.long} role='columnheader' aria-label={d.long} className='hl-weekday'>
                        {d.short.slice(0, 2)}
                      </span>
                    ))}
                  </div>
                  {panel.weeks.map(week => (
                    <div key={week[0].date.getTime()} role='row' className='hl-row'>
                      {week.map(cell => (
                        <div key={cell.date.getTime()} {...calendar.getDayCellProps(cell)}>
                          {!cell.isOutsideMonth && (
                            <button className='hl-day' {...calendar.getDayProps(cell)}>
                              {cell.label}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div>
              <div className='hl-header'>
                <button className='hl-icon' {...calendar.getPrevButtonProps()}>
                  ‹
                </button>
                <button className='hl-title' {...calendar.getTitleButtonProps()}>
                  {calendar.viewTitle}
                </button>
                <button className='hl-icon' {...calendar.getNextButtonProps()}>
                  ›
                </button>
              </div>
              <div className='hl-view-grid'>
                {calendar.view === 'months'
                  ? calendar.months.map(m => (
                      <button key={m.month} className='hl-day' {...calendar.getMonthProps(m)}>
                        {m.label.slice(0, 3)}
                      </button>
                    ))
                  : calendar.years.map(y => (
                      <button key={y.year} className='hl-day' {...calendar.getYearProps(y)}>
                        {y.label}
                      </button>
                    ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
