import { useCallback, useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import type { MutableRefObject, Ref, RefCallback } from 'react';
import { fromDateKey } from '../core';

export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const mergeRefs =
  <T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> =>
  value => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value);
      else if (ref) (ref as MutableRefObject<T | null>).current = value;
    }
  };

/** Renders `data-foo=""` when true and omits the attribute when false. */
export const flag = (on: boolean | undefined) => (on ? '' : undefined);

export type DataAttributes = { [key: `data-${string}`]: string | undefined };

export const dateFromEvent = (target: EventTarget | null, container: Element): Date | null => {
  if (!(target instanceof Element)) return null;
  const el = target.closest('[data-date]');
  if (!el || !container.contains(el)) return null;
  return fromDateKey(el.getAttribute('data-date') ?? '');
};

const noopSubscribe = () => () => {};

/** Media query match; false on the server and during hydration. */
export const useMediaQuery = (query: string | null): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!query || typeof window === 'undefined' || !window.matchMedia) return noopSubscribe();
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => Boolean(query && typeof window !== 'undefined' && window.matchMedia?.(query).matches),
    () => false,
  );
};
