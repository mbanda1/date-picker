import { createInitialState, transition } from '../state';
import type { InitialStateOptions } from '../state';
import type { PickerConfig, PickerEvent, PickerState } from '../types';

export const d = (y: number, m: number, day: number, h = 0, min = 0) =>
  new Date(y, m - 1, day, h, min);

export const config = (overrides: Partial<PickerConfig> = {}): PickerConfig => ({
  mode: 'single',
  now: d(2025, 3, 15, 10, 0),
  weekStartsOn: 0,
  numberOfMonths: 1,
  closeOnSelect: true,
  ...overrides,
});

export const setup = (cfg: PickerConfig, init?: InitialStateOptions) => {
  let state: PickerState = createInitialState(cfg, init);
  const send = (...events: PickerEvent[]) => {
    for (const event of events) state = transition(state, event, cfg);
    return state;
  };
  return { send, get state() { return state; } };
};
