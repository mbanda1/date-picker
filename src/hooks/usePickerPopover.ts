import { useEffect, useRef } from 'react';
import type { CSSProperties, MutableRefObject } from 'react';
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react-dom';
import type { Placement } from '@floating-ui/react-dom';
import { useMediaQuery } from './utils';

/** True below the sheet breakpoint. Always false on the server and during hydration. */
export const useSheetLayout = (breakpoint: number | null) =>
  useMediaQuery(breakpoint ? `(max-width: ${breakpoint - 0.02}px)` : null);

export type DismissReason = 'outside' | 'escape' | 'select' | 'apply' | 'cancel' | 'trigger';

export interface PopoverOptions {
  open: boolean;
  /** From useSheetLayout: render as a bottom sheet instead of a positioned popover. */
  isSheet: boolean;
  placement?: Placement;
  onDismiss: (reason: DismissReason) => void;
}

export interface PickerPopover {
  setReference: (el: HTMLElement | null) => void;
  setFloating: (el: HTMLElement | null) => void;
  floatingRef: MutableRefObject<HTMLElement | null>;
  /** Positioning styles; undefined in the sheet layout, where CSS places the popover. */
  style: CSSProperties | undefined;
}

export const usePickerPopover = ({
  open,
  isSheet,
  placement = 'bottom-start',
  onDismiss,
}: PopoverOptions): PickerPopover => {
  const { refs, floatingStyles, isPositioned } = useFloating({
    open: open && !isSheet,
    placement,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply: ({ availableHeight, elements }) => {
          elements.floating.style.maxHeight = isSheet ? '' : `${Math.max(availableHeight, 240)}px`;
        },
      }),
    ],
  });

  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const reference = refs.reference.current as Element | null;
      const floating = refs.floating.current;
      if (target && (reference?.contains(target) || floating?.contains(target))) return;
      dismissRef.current('outside');
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, refs]);

  return {
    setReference: refs.setReference,
    setFloating: refs.setFloating,
    floatingRef: refs.floating,
    style: isSheet ? undefined : { ...floatingStyles, opacity: isPositioned ? undefined : 0 },
  };
};
