import { useCallback, useRef, useState } from 'react';
import { createInitialState, transition } from '../core';
import type { InitialStateOptions, PickerConfig, PickerEvent, PickerState } from '../core';
import { useIsomorphicLayoutEffect } from './utils';

/**
 * Holds core picker state. `send` applies an event synchronously and returns the
 * next state, so callers can fire onChange from the same event handler.
 */
export const usePickerMachine = (config: PickerConfig, init: () => InitialStateOptions) => {
  const [state, setState] = useState<PickerState>(() => createInitialState(config, init()));
  const stateRef = useRef(state);
  const configRef = useRef(config);

  useIsomorphicLayoutEffect(() => {
    configRef.current = config;
  });

  const send = useCallback((...events: PickerEvent[]): PickerState => {
    const prev = stateRef.current;
    let next = prev;
    for (const event of events) next = transition(next, event, configRef.current);
    if (next !== prev) {
      stateRef.current = next;
      setState(next);
    }
    return next;
  }, []);

  return { state, stateRef, send };
};
