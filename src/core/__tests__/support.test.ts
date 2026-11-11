import { describe, expect, it } from 'vitest';
import { getGridKeyEvent } from '../keyboard';
import { formatTimeLabel, getMonthNames, getWeekStartsOn, getWeekdayNames } from '../locale';
import { DEFAULT_RANGE_PRESETS } from '../presets';
import { getTimeOptions } from '../time';
import { config, d, setup } from './helpers';

describe('locale', () => {
  it('reads the first day of the week from Intl', () => {
    expect(getWeekStartsOn('en-US')).toBe(0);
    expect(getWeekStartsOn('en-GB')).toBe(1);
    expect(getWeekStartsOn('not a locale', 6)).toBe(6);
  });

  it('orders weekday names by weekStartsOn', () => {
    expect(getWeekdayNames('en-US', 0).map(n => n.short)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(getWeekdayNames('en-US', 1)[0]).toEqual({ short: 'Mon', long: 'Monday' });
  });

  it('falls back to narrow names when a locale has long short names', () => {
    const names = getWeekdayNames('ar-EG', 6);
    expect(names.every(n => n.short.length <= 4)).toBe(true);
    expect(names[0].long).not.toBe(names[0].short);
  });

  it('localises month names and times', () => {
    expect(getMonthNames('fr-FR')[0]).toBe('janvier');
    expect(formatTimeLabel('13:30', 'en-US')).toMatch(/^1:30\sPM$/u);
    expect(formatTimeLabel('13:30', 'en-GB')).toBe('13:30');
  });
});

describe('getTimeOptions', () => {
  it('steps between minTime and maxTime inclusive', () => {
    expect(getTimeOptions({ minTime: '09:00', maxTime: '10:00', interval: 30 }).map(o => o.value)).toEqual([
      '09:00',
      '09:30',
      '10:00',
    ]);
  });

  it('falls back to 30 minutes for a non-positive interval instead of looping forever', () => {
    expect(getTimeOptions({ minTime: '09:00', maxTime: '10:00', interval: 0 })).toHaveLength(3);
  });
});

describe('presets', () => {
  it('this week follows weekStartsOn', () => {
    const preset = DEFAULT_RANGE_PRESETS.find(p => p.id === 'this-week')!;
    const range = preset.getRange(d(2025, 3, 12), { weekStartsOn: 1 });
    expect(range.start).toEqual(d(2025, 3, 10));
    expect(range.end!.getDate()).toBe(16);
  });
});

describe('getGridKeyEvent', () => {
  const { state } = setup(config(), { value: d(2025, 3, 12) });

  it('maps arrows, paging and selection', () => {
    expect(getGridKeyEvent({ key: 'ArrowDown' }, state)).toEqual({ type: 'MOVE_FOCUS', unit: 'week', amount: 1 });
    expect(getGridKeyEvent({ key: 'PageUp', shiftKey: true }, state)).toEqual({ type: 'MOVE_FOCUS', unit: 'year', amount: -1 });
    expect(getGridKeyEvent({ key: ' ' }, state)).toEqual({ type: 'SELECT_DAY', date: d(2025, 3, 12) });
    expect(getGridKeyEvent({ key: 'Tab' }, state)).toBeNull();
  });

  it('flips horizontal arrows in RTL', () => {
    expect(getGridKeyEvent({ key: 'ArrowLeft' }, state, { rtl: true })).toEqual({ type: 'MOVE_FOCUS', unit: 'day', amount: 1 });
  });
});
