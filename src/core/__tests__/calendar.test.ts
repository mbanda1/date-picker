import { describe, expect, it } from 'vitest';
import { getDayCells, getMonthCells, getMonthGrid, getYearCells, isRangeSelectable } from '../calendar';
import { config, d, setup } from './helpers';

describe('getMonthGrid', () => {
  it('builds whole weeks starting on weekStartsOn', () => {
    const weeks = getMonthGrid(d(2025, 3, 1), 1);
    expect(weeks[0][0]).toEqual(d(2025, 2, 24));
    expect(weeks[weeks.length - 1][6]).toEqual(d(2025, 4, 6));
    expect(weeks.every(w => w.length === 7)).toBe(true);
  });

  it('pads to six weeks when fixedWeeks is set', () => {
    expect(getMonthGrid(d(2026, 2, 1), 0)).toHaveLength(4);
    expect(getMonthGrid(d(2026, 2, 1), 0, true)).toHaveLength(6);
  });
});

describe('getDayCells', () => {
  const find = (cells: ReturnType<typeof getDayCells>, date: Date) =>
    cells.flat().find(c => !c.isOutsideMonth && c.date.getTime() === date.getTime())!;

  it('flags today from config.now, focus, and bounds', () => {
    const cfg = config({ minDate: d(2025, 3, 10) });
    const { state } = setup(cfg);
    const cells = getDayCells(state.visibleMonth, state, cfg);
    expect(find(cells, d(2025, 3, 15))).toMatchObject({ isToday: true, isFocused: true });
    expect(find(cells, d(2025, 3, 9)).isDisabled).toBe(true);
    expect(find(cells, d(2025, 3, 10)).isDisabled).toBe(false);
  });

  it('never gives the roving tab stop to a cell outside the month', () => {
    const cfg = config();
    const { state } = setup(cfg, { value: d(2025, 3, 31) });
    const focused = getDayCells(state.visibleMonth, state, cfg).flat().filter(c => c.isFocused);
    expect(focused).toHaveLength(1);
  });

  it('marks a hover preview with endpoints in date order', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2 });
    const p = setup(cfg);
    p.send({ type: 'SELECT_DAY', date: d(2025, 3, 10) }, { type: 'HOVER_DAY', date: d(2025, 3, 7) });
    const cells = getDayCells(p.state.visibleMonth, p.state, cfg);
    expect(find(cells, d(2025, 3, 7))).toMatchObject({ isRangeStart: true, isPreview: true, isSelected: false });
    expect(find(cells, d(2025, 3, 10))).toMatchObject({ isRangeEnd: true, isSelected: true });
    expect(find(cells, d(2025, 3, 8))).toMatchObject({ isInRange: true, isPreview: true });
    expect(find(cells, d(2025, 3, 11)).isInRange).toBe(false);
  });

  it('marks a complete range without preview', () => {
    const cfg = config({ mode: 'range', numberOfMonths: 2 });
    const { state } = setup(cfg, { range: { start: d(2025, 3, 5), end: d(2025, 3, 7) } });
    const cells = getDayCells(state.visibleMonth, state, cfg);
    expect(find(cells, d(2025, 3, 6))).toMatchObject({ isInRange: true, isPreview: false });
    expect(find(cells, d(2025, 3, 7))).toMatchObject({ isRangeEnd: true, isSelected: true });
  });
});

describe('month and year cells', () => {
  it('a month is enabled when any of its days is selectable', () => {
    const cfg = config({ minDate: d(2025, 1, 15), maxDate: d(2025, 11, 2) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'months' });
    const cells = getMonthCells(p.state, cfg);
    expect(cells[0].isDisabled).toBe(false);
    expect(cells[10].isDisabled).toBe(false);
    expect(cells[11].isDisabled).toBe(true);
    expect(cells[2]).toMatchObject({ isCurrent: true, isSelected: true });
  });

  it('year cells cover the page and respect bounds', () => {
    const cfg = config({ maxDate: d(2026, 1, 1) });
    const p = setup(cfg);
    p.send({ type: 'OPEN' }, { type: 'SET_VIEW', view: 'years' });
    const cells = getYearCells(p.state, cfg);
    expect(cells.map(c => c.year)).toEqual(Array.from({ length: 12 }, (_, i) => 2016 + i));
    expect(cells.find(c => c.year === 2026)!.isDisabled).toBe(false);
    expect(cells.find(c => c.year === 2027)!.isDisabled).toBe(true);
  });
});

describe('isRangeSelectable', () => {
  it('rejects incomplete ranges and ranges containing unavailable days', () => {
    const cfg = config({ mode: 'range', isDateUnavailable: date => date.getDate() === 8 });
    expect(isRangeSelectable(setup(cfg, { range: { start: d(2025, 3, 5), end: null } }).state, cfg)).toBe(false);
    expect(isRangeSelectable(setup(cfg, { range: { start: d(2025, 3, 5), end: d(2025, 3, 10) } }).state, cfg)).toBe(false);
    expect(isRangeSelectable(setup(cfg, { range: { start: d(2025, 3, 9), end: d(2025, 3, 10) } }).state, cfg)).toBe(true);
  });
});
