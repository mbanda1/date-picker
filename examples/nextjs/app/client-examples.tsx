'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { addDays, format, isWeekend } from 'date-fns';
import { DatePicker, DateRangePicker, type DateRange } from '@mbanda1/date-picker';

const EMPTY_RANGE: DateRange = { start: null, end: null };

const show = (date: Date | null) => (date ? format(date, 'EEE d MMM yyyy, HH:mm') : 'null');

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <button
      type='button'
      className='button'
      aria-pressed={dark}
      onClick={() => {
        document.documentElement.classList.toggle('dark', !dark);
        setDark(!dark);
      }}
    >
      {dark ? 'Light' : 'Dark'} theme
    </button>
  );
}

export function ControlledSingle() {
  const [date, setDate] = useState<Date | null>(null);
  const [meeting, setMeeting] = useState<Date | null>(null);

  return (
    <section>
      <h2>Single date</h2>
      <div className='grid'>
        <div className='stack'>
          <label htmlFor='due'>Due date (weekdays only, from today)</label>
          <DatePicker id='due' value={date} onChange={setDate} minDate={new Date()} isDateUnavailable={isWeekend} />
          <output className='muted'>value: {show(date)}</output>
        </div>
        <div className='stack'>
          <label htmlFor='meeting'>Meeting (date and time)</label>
          <DatePicker
            id='meeting'
            value={meeting}
            onChange={setMeeting}
            showTime
            minTime='08:00'
            maxTime='18:00'
            timeInterval={15}
            dateFormat='EEE d MMM yyyy, HH:mm'
          />
          <output className='muted'>value: {show(meeting)}</output>
        </div>
      </div>
    </section>
  );
}

export function RangeExamples() {
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const [stay, setStay] = useState<DateRange>(EMPTY_RANGE);

  return (
    <section>
      <h2>Date range</h2>
      <div className='grid'>
        <div className='stack'>
          <label htmlFor='report'>Reporting period (presets, Apply)</label>
          <DateRangePicker id='report' value={range} onChange={setRange} presets maxDate={new Date()} />
          <output className='muted'>
            {show(range.start)} → {show(range.end)}
          </output>
        </div>
        <div className='stack'>
          <label htmlFor='stay'>Stay (autoApply, next 90 days)</label>
          <DateRangePicker
            id='stay'
            value={stay}
            onChange={setStay}
            autoApply
            minDate={new Date()}
            maxDate={addDays(new Date(), 90)}
            dateFormat='d MMM'
            separator=' → '
          />
          <output className='muted'>
            {show(stay.start)} → {show(stay.end)}
          </output>
        </div>
      </div>
    </section>
  );
}

type FormValues = { eventDate: Date | null; period: DateRange };

export function HookFormExample() {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { eventDate: null, period: EMPTY_RANGE },
  });

  return (
    <section>
      <h2>React Hook Form</h2>
      <p className='muted'>
        Submit without a date: RHF focuses the picker through the forwarded ref and shows the error.
      </p>
      <form className='stack' onSubmit={handleSubmit(setSubmitted)} noValidate>
        <label htmlFor='event'>Event date (required)</label>
        <Controller
          control={control}
          name='eventDate'
          rules={{ required: 'Pick an event date' }}
          render={({ field, fieldState }) => (
            <>
              <DatePicker
                {...field}
                id='event'
                invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? 'event-error' : undefined}
              />
              {fieldState.error && (
                <span id='event-error' className='error'>
                  {fieldState.error.message}
                </span>
              )}
            </>
          )}
        />
        <label htmlFor='period'>Period</label>
        <Controller
          control={control}
          name='period'
          render={({ field }) => <DateRangePicker {...field} id='period' presets />}
        />
        <button type='submit' className='button'>
          Submit
        </button>
      </form>
      {submitted && (
        <pre className='code'>
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </section>
  );
}

export function LocalisedPickers() {
  return (
    <section>
      <h2>Locales and direction</h2>
      <div className='grid'>
        <div className='stack'>
          <label htmlFor='fr'>Français (week starts Monday)</label>
          <DatePicker
            id='fr'
            locale='fr-FR'
            dateFormat='dd/MM/yyyy'
            placeholder='Choisir une date'
            labels={{
              dialog: 'Choisir une date',
              openCalendar: 'Ouvrir le calendrier',
              clear: 'Effacer',
              previousMonth: 'Mois précédent',
              nextMonth: 'Mois suivant',
              chooseMonth: 'Choisir le mois',
              today: "Aujourd'hui",
            }}
          />
        </div>
        <div className='stack' dir='rtl'>
          <label htmlFor='ar'>العربية (RTL)</label>
          <DatePicker id='ar' locale='ar-EG' dir='rtl' dateFormat='yyyy/MM/dd' showTodayButton={false} />
        </div>
      </div>
    </section>
  );
}

export function CustomTheme() {
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  return (
    <section>
      <h2>Custom theme</h2>
      <p className='muted'>
        CSS variables on <code>className</code> and <code>popoverClassName</code> (the popover renders in{' '}
        <code>&lt;body&gt;</code>).
      </p>
      <div className='stack'>
        <label htmlFor='themed'>Indigo, square corners</label>
        <DateRangePicker
          id='themed'
          value={range}
          onChange={setRange}
          className='theme-indigo'
          popoverClassName='theme-indigo'
          fixedWeeks
        />
      </div>
    </section>
  );
}
