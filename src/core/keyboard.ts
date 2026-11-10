import type { PickerEvent, PickerState } from './types';

export interface GridKeyInput {
  key: string;
  shiftKey?: boolean;
}

/**
 * Maps a key press inside the days grid to a picker event, following the
 * WAI-ARIA date picker dialog pattern. Returns null for keys the grid ignores.
 */
export const getGridKeyEvent = (
  { key, shiftKey = false }: GridKeyInput,
  state: PickerState,
  { rtl = false }: { rtl?: boolean } = {},
): PickerEvent | null => {
  const horizontal = rtl ? -1 : 1;
  switch (key) {
    case 'ArrowLeft':
      return { type: 'MOVE_FOCUS', unit: 'day', amount: -horizontal };
    case 'ArrowRight':
      return { type: 'MOVE_FOCUS', unit: 'day', amount: horizontal };
    case 'ArrowUp':
      return { type: 'MOVE_FOCUS', unit: 'week', amount: -1 };
    case 'ArrowDown':
      return { type: 'MOVE_FOCUS', unit: 'week', amount: 1 };
    case 'PageUp':
      return { type: 'MOVE_FOCUS', unit: shiftKey ? 'year' : 'month', amount: -1 };
    case 'PageDown':
      return { type: 'MOVE_FOCUS', unit: shiftKey ? 'year' : 'month', amount: 1 };
    case 'Home':
      return { type: 'FOCUS_WEEK_EDGE', edge: 'start' };
    case 'End':
      return { type: 'FOCUS_WEEK_EDGE', edge: 'end' };
    case 'Enter':
    case ' ':
      return { type: 'SELECT_DAY', date: state.focusedDate };
    case 'Escape':
      return { type: 'CLOSE' };
    default:
      return null;
  }
};
