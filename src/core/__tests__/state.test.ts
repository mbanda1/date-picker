import { describe, expect, it } from 'vitest';
import { endOfDay } from 'date-fns';
import { getNavState, getPanelMonths, transition, createInitialState } from '../state';
import { config, d, setup } from './helpers';

describe('month and year selection never overflow (review #1)', () => {
  it('picking February from Jan 31 shows February, not March', () => {
    const p = setup(config(), { value: d(2025, 1, 31) });
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'months' }, { type: 'SELECT_MONTH', month: 1 });
    expect(p.state.visibleMonth).toEqual(d(2025, 2, 1));
    expect(p.state.focusedDate).toEqual(d(2025, 2, 28));
    expect(p.state.view).toBe('days');
  });

  it('picking a non-leap year from Feb 29 stays in February', () => {
    const p = setup(config({ now: d(2024, 2, 29) }), { value: d(2024, 2, 29) });
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'years' }, { type: 'SELECT_YEAR', year: 2025 });
    expect(p.state.visibleMonth).toEqual(d(2025, 2, 1));
    expect(p.state.focusedDate).toEqual(d(2025, 2, 28));
  });

  it('range: picking a month from the right calendar overflows neither panel', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2, now: d(2025, 1, 31) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'months', panel: 1 }, { type: 'SELECT_MONTH', month: 2 });
    expect(getPanelMonths(p.state, cfg)).toEqual([d(2025, 2, 1), d(2025, 3, 1)]);
  });
});

describe('year page navigation (review #2)', () => {
  it('next page is reachable when it contains maxDate', () => {
    const cfg = config({ maxDate: d(2030, 6, 1) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'years' });
    expect(p.state.yearPageStart).toBe(2016);
    expect(getNavState(p.state, cfg).canNext).toBe(true);
    p.send({ type: 'NAV_NEXT' });
    expect(p.state.yearPageStart).toBe(2028);
    expect(getNavState(p.state, cfg).canNext).toBe(false);
  });

  it('previous page is reachable when it contains minDate', () => {
    const cfg = config({ minDate: d(2010, 1, 1) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'years' });
    expect(getNavState(p.state, cfg).canPrev).toBe(true);
    p.send({ type: 'NAV_PREV' });
    expect(p.state.yearPageStart).toBe(2004);
    expect(getNavState(p.state, cfg).canPrev).toBe(false);
  });

  it('previous page is blocked when minDate is the first year of the current page', () => {
    const cfg = config({ minDate: d(2016, 1, 1) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'years' });
    expect(getNavState(p.state, cfg).canPrev).toBe(false);
    p.send({ type: 'NAV_PREV' });
    expect(p.state.yearPageStart).toBe(2016);
  });

  it('the right calendar pages through its own years', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2, now: d(2027, 12, 10) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'years', panel: 1 });
    expect(p.state.yearPageStart).toBe(2028);
  });
});

describe('range calendars stay in step (review #5)', () => {
  it('picking August on the right shows Jul | Aug, and Next moves both', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2 });
    const p = setup(cfg);
    expect(getPanelMonths(p.state, cfg)).toEqual([d(2025, 3, 1), d(2025, 4, 1)]);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'months', panel: 1 }, { type: 'SELECT_MONTH', month: 7 });
    expect(getPanelMonths(p.state, cfg)).toEqual([d(2025, 7, 1), d(2025, 8, 1)]);
    p.send({ type: 'NAV_NEXT' });
    expect(getPanelMonths(p.state, cfg)).toEqual([d(2025, 8, 1), d(2025, 9, 1)]);
  });

  it('months view in the right calendar navigates by its own year', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2, now: d(2025, 12, 1) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'months', panel: 1 }, { type: 'NAV_NEXT' }, { type: 'SELECT_MONTH', month: 0 });
    expect(getPanelMonths(p.state, cfg)).toEqual([d(2026, 12, 1), d(2027, 1, 1)]);
  });
});

describe('days navigation bounds', () => {
  it('blocks Previous only when the previous month has no selectable day', () => {
    expect(getNavState(setup(config({ minDate: d(2025, 3, 10) })).state, config({ minDate: d(2025, 3, 10) })).canPrev).toBe(false);
    const cfg = config({ minDate: d(2025, 2, 28) });
    expect(getNavState(setup(cfg).state, cfg).canPrev).toBe(true);
  });

  it('accounts for both visible months when checking Next', () => {
    const blocked = config({ mode: 'range', numberOfMonths: 2, maxDate: d(2025, 4, 30) });
    expect(getNavState(setup(blocked).state, blocked).canNext).toBe(false);
    const open = config({ mode: 'range', numberOfMonths: 2, maxDate: d(2025, 5, 1) });
    expect(getNavState(setup(open).state, open).canNext).toBe(true);
  });

  it('keeps both range panels inside maxDate', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2, maxDate: d(2025, 3, 20) });
    expect(getPanelMonths(setup(cfg).state, cfg)).toEqual([d(2025, 2, 1), d(2025, 3, 1)]);
  });

  it('ignores navigation that the nav state disallows', () => {
    const cfg = config({ maxDate: d(2025, 3, 31) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'NAV_NEXT' });
    expect(p.state.visibleMonth).toEqual(d(2025, 3, 1));
  });

  it('moves focus with the month and clamps it into bounds', () => {
    const cfg = config({ maxDate: d(2025, 4, 10) });
    const p = setup(cfg, { value: d(2025, 3, 25) });
    p.send({ type: 'OPEN' }, { type: 'NAV_NEXT' });
    expect(p.state.focusedDate).toEqual(d(2025, 4, 10));
  });
});

describe('single selection', () => {
  it('selects a day and closes', () => {
    const p = setup(config());
    p.send({ type: 'OPEN' }, { type: 'SELECT_DAY', date: d(2025, 3, 20, 15, 45) });
    expect(p.state.selected).toEqual(d(2025, 3, 20));
    expect(p.state.open).toBe(false);
  });

  it('ignores days outside bounds or marked unavailable', () => {
    const cfg = config({ minDate: d(2025, 3, 10), isDateUnavailable: date => date.getDay() === 0 });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SELECT_DAY', date: d(2025, 3, 9) }, { type: 'SELECT_DAY', date: d(2025, 3, 16) });
    expect(p.state.selected).toBeNull();
    expect(p.state.open).toBe(true);
  });

  it('with showTime stays open, applies the time, and keeps it when the day changes', () => {
    const p = setup(config({ showTime: true }));
    p.send({ type: 'OPEN' }, { type: 'SELECT_DAY', date: d(2025, 3, 20) }, { type: 'SELECT_TIME', time: '14:30' });
    expect(p.state.selected).toEqual(d(2025, 3, 20, 14, 30));
    expect(p.state.open).toBe(true);
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 21) });
    expect(p.state.selected).toEqual(d(2025, 3, 21, 14, 30));
  });

  it('ignores a time before a day is picked', () => {
    const p = setup(config({ showTime: true }));
    p.send({ type: 'SELECT_TIME', time: '09:00' });
    expect(p.state.selected).toBeNull();
  });

  it('SELECT_TODAY uses config.now', () => {
    const p = setup(config());
    p.send({ type: 'OPEN' }, { type: 'SELECT_TODAY' });
    expect(p.state.selected).toEqual(d(2025, 3, 15));
  });

  it('SET_VALUE reveals the new value only while closed', () => {
    const p = setup(config());
    p.send({ type: 'SET_VALUE', value: d(2026, 8, 3) });
    expect(p.state.visibleMonth).toEqual(d(2026, 8, 1));
    p.send({ type: 'OPEN' }, { type: 'SET_VALUE', value: d(2027, 1, 1) });
    expect(p.state.visibleMonth).toEqual(d(2026, 8, 1));
  });

  it('a disabled picker cannot open or change selection, but accepts controlled values', () => {
    const cfg = config({ disabled: true });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SELECT_DAY', date: d(2025, 3, 20) });
    expect(p.state.open).toBe(false);
    expect(p.state.selected).toBeNull();
    p.send({ type: 'SET_VALUE', value: d(2025, 3, 20) });
    expect(p.state.selected).toEqual(d(2025, 3, 20));
  });
});

describe('range selection', () => {
  const cfg = config({ mode: 'range', numberOfMonths: 2 });

  it('two clicks make a range with the end at end of day', () => {
    const p = setup(cfg);
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 5) }, { type: 'SELECT_DAY', date: d(2025, 3, 10) });
    expect(p.state.range).toEqual({ start: d(2025, 3, 5), end: endOfDay(d(2025, 3, 10)) });
    expect(p.state.rangePhase).toBe('start');
  });

  it('clicking before the start swaps the ends, matching the hover preview', () => {
    const p = setup(cfg);
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 10) }, { type: 'SELECT_DAY', date: d(2025, 3, 5) });
    expect(p.state.range).toEqual({ start: d(2025, 3, 5), end: endOfDay(d(2025, 3, 10)) });
  });

  it('a click after a complete range starts a new one', () => {
    const p = setup(cfg, { range: { start: d(2025, 3, 5), end: d(2025, 3, 10) } });
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 20) });
    expect(p.state.range).toEqual({ start: d(2025, 3, 20), end: null });
    expect(p.state.rangePhase).toBe('end');
  });

  it('hover only previews while picking the end', () => {
    const p = setup(cfg);
    p.send({ type: 'HOVER_DAY', date: d(2025, 3, 8) });
    expect(p.state.hoverDate).toBeNull();
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 5) }, { type: 'HOVER_DAY', date: d(2025, 3, 8) });
    expect(p.state.hoverDate).toEqual(d(2025, 3, 8));
  });

  it('repeated hover on the same day returns the same state object', () => {
    const p = setup(cfg);
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 5) }, { type: 'HOVER_DAY', date: d(2025, 3, 8) });
    const before = p.state;
    expect(transition(before, { type: 'HOVER_DAY', date: d(2025, 3, 8, 12) }, cfg)).toBe(before);
  });

  it('SET_RANGE normalises reversed input and reveals the start', () => {
    const p = setup(cfg);
    p.send({ type: 'SET_RANGE', range: { start: d(2025, 9, 10), end: d(2025, 9, 2) } });
    expect(p.state.range).toEqual({ start: d(2025, 9, 2), end: endOfDay(d(2025, 9, 10)) });
    expect(p.state.visibleMonth).toEqual(d(2025, 9, 1));
  });

  it('CLEAR resets the draft', () => {
    const p = setup(cfg, { range: { start: d(2025, 3, 5), end: d(2025, 3, 10) } });
    p.send({ type: 'CLEAR' });
    expect(p.state.range).toEqual({ start: null, end: null });
    expect(p.state.rangePhase).toBe('start');
  });
});

describe('keyboard focus', () => {
  it('moving past the visible month scrolls to it', () => {
    const p = setup(config(), { value: d(2025, 3, 31) });
    p.send({ type: 'OPEN' }, { type: 'MOVE_FOCUS', unit: 'day', amount: 1 });
    expect(p.state.focusedDate).toEqual(d(2025, 4, 1));
    expect(p.state.visibleMonth).toEqual(d(2025, 4, 1));
  });

  it('does not scroll when the target is in the second range panel', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2 });
    const p = setup(cfg, { range: { start: d(2025, 3, 31), end: null } });
    p.send({ type: 'OPEN' }, { type: 'MOVE_FOCUS', unit: 'day', amount: 1 });
    expect(p.state.visibleMonth).toEqual(d(2025, 3, 1));
    expect(p.state.hoverDate).toEqual(d(2025, 4, 1));
  });

  it('PageDown from Jan 31 lands on the last day of February', () => {
    const p = setup(config(), { value: d(2025, 1, 31) });
    p.send({ type: 'OPEN' }, { type: 'MOVE_FOCUS', unit: 'month', amount: 1 });
    expect(p.state.focusedDate).toEqual(d(2025, 2, 28));
  });

  it('Home and End respect weekStartsOn', () => {
    const p = setup(config({ weekStartsOn: 1 }), { value: d(2025, 3, 12) });
    p.send({ type: 'FOCUS_WEEK_EDGE', edge: 'start' });
    expect(p.state.focusedDate).toEqual(d(2025, 3, 10));
    p.send({ type: 'FOCUS_WEEK_EDGE', edge: 'end' });
    expect(p.state.focusedDate).toEqual(d(2025, 3, 16));
  });

  it('focus never leaves the bounds', () => {
    const p = setup(config({ maxDate: d(2025, 3, 20) }), { value: d(2025, 3, 18) });
    p.send({ type: 'MOVE_FOCUS', unit: 'week', amount: 1 });
    expect(p.state.focusedDate).toEqual(d(2025, 3, 20));
  });
});

describe('initial state', () => {
  it('is deterministic for a given config.now (SSR safe)', () => {
    expect(createInitialState(config())).toEqual(createInitialState(config()));
  });

  it('clamps the initial month into bounds', () => {
    const s = createInitialState(config({ minDate: d(2026, 1, 5) }));
    expect(s.visibleMonth).toEqual(d(2026, 1, 1));
    expect(s.focusedDate).toEqual(d(2026, 1, 5));
  });

  it('swaps minDate and maxDate when given in the wrong order', () => {
    const cfg = config({ minDate: d(2025, 4, 1), maxDate: d(2025, 3, 1) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SELECT_DAY', date: d(2025, 3, 15) });
    expect(p.state.selected).toEqual(d(2025, 3, 15));
  });
});
