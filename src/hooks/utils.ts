import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
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

/** Stable getter that returns the same merged ref for the same forwarded ref. */
export const useMergedRef = <T>(own: MutableRefObject<T | null>) => {
  const cache = useRef<{ ref: Ref<T>; merged: RefCallback<T> } | null>(null);
  return useCallback(
    (ref?: Ref<T>): Ref<T> => {
      if (!ref) return own;
      if (cache.current?.ref !== ref) cache.current = { ref, merged: mergeRefs(own, ref) };
      return cache.current.merged;
    },
    [own],
  );
};

const noopSubscribe = () => () => {};

const mediaQueryLists = new Map<string, MediaQueryList>();

const getMediaQueryList = (query: string): MediaQueryList | null => {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  let mql = mediaQueryLists.get(query);
  if (!mql) {
    mql = window.matchMedia(query);
    mediaQueryLists.set(query, mql);
  }
  return mql;
};

/** Media query match; false on the server and during hydration. */
export const useMediaQuery = (query: string | null): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = query ? getMediaQueryList(query) : null;
      if (!mql) return noopSubscribe();
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => Boolean(query && getMediaQueryList(query)?.matches),
    () => false,
  );
};
