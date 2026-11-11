'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { format, isWeekend } from 'date-fns';
import { DatePicker, DateRangePicker, type DateRange } from '@mbanda1/date-picker';

type Mode = 'single' | 'range';
type Layout = 'auto' | 'popover' | 'sheet';
type Clock = 'locale' | '12' | '24';

interface Options {
  mode: Mode;
  locale: string;
  rtl: boolean;
  dateFormat: string;
  layout: Layout;
  futureOnly: boolean;
  noWeekends: boolean;
  fixedWeeks: boolean;
  clearable: boolean;
  disabled: boolean;
  invalid: boolean;
  showTime: boolean;
  timeInterval: number;
  clock: Clock;
  closeOnSelect: boolean;
  showTodayButton: boolean;
  presets: boolean;
  autoApply: boolean;
  numberOfMonths: number;
}

const DEFAULTS: Options = {
  mode: 'single',
  locale: 'en-US',
  rtl: false,
  dateFormat: '',
  layout: 'auto',
  futureOnly: false,
  noWeekends: false,
  fixedWeeks: false,
  clearable: true,
  disabled: false,
  invalid: false,
  showTime: false,
  timeInterval: 30,
  clock: 'locale',
  closeOnSelect: true,
  showTodayButton: true,
  presets: false,
  autoApply: false,
  numberOfMonths: 2,
};

const LOCALES = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'ja-JP', 'ar-EG'];
const ALWAYS_SHEET = 100_000;
const EMPTY_RANGE: DateRange = { start: null, end: null };

const SHEET_BREAKPOINT: Record<Layout, number | null | undefined> = {
  auto: undefined,
  popover: null,
  sheet: ALWAYS_SHEET,
};

const HOUR12: Record<Clock, boolean | undefined> = { locale: undefined, '12': true, '24': false };

const show = (date: Date | null) => (date ? format(date, 'EEE d MMM yyyy, HH:mm') : 'null');

const checkFormat = (dateFormat: string) => {
  if (!dateFormat) return null;
  try {
    format(new Date(), dateFormat);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
};

const toSnippet = (o: Options, dateFormat: string | undefined) => {
  const single = o.mode === 'single';
  const props = ["id='date'", single ? 'value={date}' : 'value={range}', single ? 'onChange={setDate}' : 'onChange={setRange}'];
  const add = (when: boolean, prop: string) => when && props.push(prop);

  add(o.locale !== DEFAULTS.locale, `locale='${o.locale}'`);
  add(o.rtl, "dir='rtl'");
  add(Boolean(dateFormat), `dateFormat='${dateFormat}'`);
  add(o.layout === 'popover', 'sheetBreakpoint={null}');
  add(o.layout === 'sheet', `sheetBreakpoint={${ALWAYS_SHEET}}`);
  add(o.futureOnly, 'minDate={new Date()}');
  add(o.noWeekends, 'isDateUnavailable={isWeekend}');
  add(o.fixedWeeks, 'fixedWeeks');
  add(!o.clearable, 'clearable={false}');
  add(o.disabled, 'disabled');
  add(o.invalid, 'invalid');
  if (single) {
    add(o.showTime, 'showTime');
    add(o.showTime && o.timeInterval !== DEFAULTS.timeInterval, `timeInterval={${o.timeInterval}}`);
    add(o.showTime && o.clock !== 'locale', `hour12={${o.clock === '12'}}`);
    add(!o.showTime && !o.closeOnSelect, 'closeOnSelect={false}');
    add(!o.showTodayButton, 'showTodayButton={false}');
  } else {
    add(o.presets, 'presets');
    add(o.autoApply, 'autoApply');
    add(o.numberOfMonths !== DEFAULTS.numberOfMonths, `numberOfMonths={${o.numberOfMonths}}`);
  }

  return `<${single ? 'DatePicker' : 'DateRangePicker'}\n  ${props.join('\n  ')}\n/>`;
};

function Toggle(props: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className='pg-check' htmlFor={props.id}>
      <input id={props.id} type='checkbox' checked={props.checked} onChange={e => props.onChange(e.target.checked)} />
      {props.label}
    </label>
  );
}

function Field(props: { id: string; label: string; children: ReactNode }) {
  return (
    <div className='pg-field'>
      <label htmlFor={props.id}>{props.label}</label>
      {props.children}
    </div>
  );
}

export function Playground() {
  const [o, setOptions] = useState<Options>(DEFAULTS);
  const [date, setDate] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const set = <K extends keyof Options>(key: K, value: Options[K]) => setOptions(prev => ({ ...prev, [key]: value }));

  const formatError = checkFormat(o.dateFormat);
  const dateFormat = o.dateFormat && !formatError ? o.dateFormat : undefined;
  const single = o.mode === 'single';

  const shared = {
    id: 'pg-picker',
    locale: o.locale,
    dir: o.rtl ? ('rtl' as const) : undefined,
    dateFormat,
    sheetBreakpoint: SHEET_BREAKPOINT[o.layout],
    minDate: o.futureOnly ? new Date() : undefined,
    isDateUnavailable: o.noWeekends ? isWeekend : undefined,
    fixedWeeks: o.fixedWeeks,
    clearable: o.clearable,
    disabled: o.disabled,
    invalid: o.invalid,
  };

  return (
    <div className='pg-layout'>
      <section className='pg-controls' aria-labelledby='pg-controls-title'>
        <h2 id='pg-controls-title'>Props</h2>

        <fieldset className='pg-segmented'>
          <legend>Component</legend>
          {(['single', 'range'] as const).map(mode => (
            <label key={mode} className='pg-check'>
              <input
                type='radio'
                name='pg-mode'
                value={mode}
                checked={o.mode === mode}
                onChange={() => set('mode', mode)}
              />
              {mode === 'single' ? 'DatePicker' : 'DateRangePicker'}
            </label>
          ))}
        </fieldset>

        <Field id='pg-locale' label='locale'>
          <select id='pg-locale' value={o.locale} onChange={e => set('locale', e.target.value)}>
            {LOCALES.map(locale => (
              <option key={locale}>{locale}</option>
            ))}
          </select>
        </Field>

        <Field id='pg-format' label='dateFormat'>
          <input
            id='pg-format'
            value={o.dateFormat}
            placeholder={single ? (o.showTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : 'yyyy MMM d'}
            aria-invalid={formatError ? true : undefined}
            aria-describedby={formatError ? 'pg-format-error' : undefined}
            onChange={e => set('dateFormat', e.target.value)}
          />
          {formatError && (
            <span id='pg-format-error' className='error'>
              {formatError}
            </span>
          )}
        </Field>

        <Field id='pg-layout' label='Layout'>
          <select id='pg-layout' value={o.layout} onChange={e => set('layout', e.target.value as Layout)}>
            <option value='auto'>Auto (sheet under 640px)</option>
            <option value='popover'>Always popover</option>
            <option value='sheet'>Always bottom sheet</option>
          </select>
        </Field>

        <div className='pg-checks'>
          <Toggle id='pg-rtl' label='Right-to-left' checked={o.rtl} onChange={v => set('rtl', v)} />
          <Toggle id='pg-future' label='From today only' checked={o.futureOnly} onChange={v => set('futureOnly', v)} />
          <Toggle id='pg-weekends' label='No weekends' checked={o.noWeekends} onChange={v => set('noWeekends', v)} />
          <Toggle id='pg-fixed' label='fixedWeeks' checked={o.fixedWeeks} onChange={v => set('fixedWeeks', v)} />
          <Toggle id='pg-clearable' label='clearable' checked={o.clearable} onChange={v => set('clearable', v)} />
          <Toggle id='pg-disabled' label='disabled' checked={o.disabled} onChange={v => set('disabled', v)} />
          <Toggle id='pg-invalid' label='invalid' checked={o.invalid} onChange={v => set('invalid', v)} />
        </div>

        {single ? (
          <>
            <h3>DatePicker</h3>
            <div className='pg-checks'>
              <Toggle id='pg-time' label='showTime' checked={o.showTime} onChange={v => set('showTime', v)} />
              <Toggle
                id='pg-close'
                label='closeOnSelect'
                checked={o.closeOnSelect}
                onChange={v => set('closeOnSelect', v)}
              />
              <Toggle
                id='pg-today'
                label='showTodayButton'
                checked={o.showTodayButton}
                onChange={v => set('showTodayButton', v)}
              />
            </div>
            {o.showTime && (
              <div className='pg-row'>
                <Field id='pg-interval' label='timeInterval'>
                  <select
                    id='pg-interval'
                    value={o.timeInterval}
                    onChange={e => set('timeInterval', Number(e.target.value))}
                  >
                    {[5, 15, 30, 60].map(minutes => (
                      <option key={minutes} value={minutes}>
                        {minutes} min
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id='pg-clock' label='hour12'>
                  <select id='pg-clock' value={o.clock} onChange={e => set('clock', e.target.value as Clock)}>
                    <option value='locale'>From locale</option>
                    <option value='12'>12-hour</option>
                    <option value='24'>24-hour</option>
                  </select>
                </Field>
              </div>
            )}
          </>
        ) : (
          <>
            <h3>DateRangePicker</h3>
            <div className='pg-checks'>
              <Toggle id='pg-presets' label='presets' checked={o.presets} onChange={v => set('presets', v)} />
              <Toggle id='pg-auto' label='autoApply' checked={o.autoApply} onChange={v => set('autoApply', v)} />
            </div>
            <Field id='pg-months' label='numberOfMonths'>
              <select
                id='pg-months'
                value={o.numberOfMonths}
                onChange={e => set('numberOfMonths', Number(e.target.value))}
              >
                {[1, 2, 3].map(n => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
          </>
        )}

        <button type='button' className='button' onClick={() => setOptions(DEFAULTS)}>
          Reset props
        </button>
      </section>

      <div className='pg-preview'>
        <section aria-labelledby='pg-preview-title'>
          <h2 id='pg-preview-title'>Preview</h2>
          <div className='stack' dir={o.rtl ? 'rtl' : undefined}>
            <label htmlFor='pg-picker'>{single ? 'Date' : 'Date range'}</label>
            {single ? (
              <DatePicker
                {...shared}
                value={date}
                onChange={setDate}
                showTime={o.showTime}
                timeInterval={o.timeInterval}
                hour12={HOUR12[o.clock]}
                closeOnSelect={o.closeOnSelect}
                showTodayButton={o.showTodayButton}
              />
            ) : (
              <DateRangePicker
                {...shared}
                value={range}
                onChange={setRange}
                presets={o.presets}
                autoApply={o.autoApply}
                numberOfMonths={o.numberOfMonths}
              />
            )}
          </div>
          <output className='muted pg-value' htmlFor='pg-picker'>
            {single ? `value: ${show(date)}` : `start: ${show(range.start)}\nend: ${show(range.end)}`}
          </output>
        </section>

        <section aria-labelledby='pg-code-title'>
          <h2 id='pg-code-title'>Code</h2>
          <pre className='code'>{toSnippet(o, dateFormat)}</pre>
        </section>
      </div>
    </div>
  );
}
