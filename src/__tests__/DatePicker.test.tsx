// @vitest-environment jsdom
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from '../index';
import type { DatePickerProps } from '../index';

const NOW = new Date(2025, 2, 15, 10, 0);

afterEach(cleanup);

const setup = (props: Partial<DatePickerProps> = {}) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  const utils = render(<DatePicker aria-label='Event date' now={NOW} onChange={onChange} {...props} />);
  const input = screen.getByRole('textbox', { name: 'Event date' }) as HTMLInputElement;
  return { ...utils, user, onChange, input };
};

const day = (label: string) => screen.getByRole('button', { name: label });
const dialog = () => screen.queryByRole('dialog');

describe('DatePicker', () => {
  it('opens on click, focuses the selected day, and commits a picked day', async () => {
    const { user, input, onChange } = setup({ defaultValue: new Date(2025, 2, 10) });
    expect(input.value).toBe('2025-03-10');

    await user.click(input);
    expect(dialog()).not.toBeNull();
    expect(document.activeElement).toBe(day('Monday, March 10, 2025'));

    await user.click(day('Thursday, March 20, 2025'));
    expect(onChange).toHaveBeenCalledWith(new Date(2025, 2, 20));
    expect(dialog()).toBeNull();
    expect(input.value).toBe('2025-03-20');
    expect(document.activeElement).toBe(input);
  });

  it('closes when the calendar button is clicked while open (review #3)', async () => {
    const { user, input } = setup();
    await user.click(input);
    expect(dialog()).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(dialog()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(dialog()).not.toBeNull();
  });

  it('closes on outside pointer down without committing', async () => {
    const { user, input, onChange } = setup();
    render(<button>elsewhere</button>);
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(dialog()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is fully keyboard operable (review #8)', async () => {
    const { user, input, onChange } = setup();
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(day('Saturday, March 15, 2025'));

    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(document.activeElement).toBe(day('Sunday, March 23, 2025'));

    await user.keyboard('{PageDown}');
    expect(screen.getByText('April 2025')).toBeTruthy();
    expect(document.activeElement).toBe(day('Wednesday, April 23, 2025'));

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(new Date(2025, 3, 23));
    expect(document.activeElement).toBe(input);

    await user.keyboard('{ArrowDown}');
    expect(dialog()).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('keeps day buttons mounted across hover and focus changes (review #4)', async () => {
    const { user, input } = setup({ defaultValue: new Date(2025, 2, 10) });
    await user.click(input);
    const before = day('Monday, March 10, 2025');
    await user.keyboard('{ArrowRight}{ArrowLeft}');
    await user.hover(day('Friday, March 21, 2025'));
    expect(day('Monday, March 10, 2025')).toBe(before);
    expect(document.activeElement).toBe(before);
  });

  it('picks February from Jan 31 without jumping to March (review #1)', async () => {
    const { user, input } = setup({ defaultValue: new Date(2025, 0, 31) });
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'January 2025, Choose month' }));
    await user.click(screen.getByRole('button', { name: 'February' }));
    expect(screen.getByText('February 2025')).toBeTruthy();
    expect(document.activeElement).toBe(day('Friday, February 28, 2025'));
  });

  it('reaches the year page that contains maxDate (review #2)', async () => {
    const { user, input } = setup({ maxDate: new Date(2030, 5, 1) });
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'March 2025, Choose month' }));
    await user.click(screen.getByRole('button', { name: '2025, Choose year' }));
    await user.click(screen.getByRole('button', { name: 'Next years' }));
    await user.click(screen.getByRole('button', { name: '2030' }));
    expect(screen.getByText('March 2030')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('ignores days outside the bounds', async () => {
    const { user, input, onChange } = setup({ minDate: new Date(2025, 2, 12) });
    await user.click(input);
    const blocked = day('Tuesday, March 11, 2025');
    expect(blocked.getAttribute('aria-disabled')).toBe('true');
    await user.click(blocked);
    expect(onChange).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('clears the value', async () => {
    const { user, input, onChange } = setup({ defaultValue: new Date(2025, 2, 10) });
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(input.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('with showTime commits only once a time is chosen', async () => {
    const { user, input, onChange } = setup({ showTime: true, minTime: '09:00', maxTime: '11:00', timeInterval: 60 });
    await user.click(input);
    await user.click(day('Thursday, March 20, 2025'));
    expect(onChange).not.toHaveBeenCalled();
    const options = screen.getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['9:00 AM', '10:00 AM', '11:00 AM']);
    await user.click(screen.getByRole('option', { name: '10:00 AM' }));
    expect(onChange).toHaveBeenCalledWith(new Date(2025, 2, 20, 10, 0));
    expect(input.value).toBe('2025-03-20 10:00');
  });

  it('selects today from the footer', async () => {
    const { user, input, onChange } = setup();
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledWith(new Date(2025, 2, 15));
  });

  it('does not open when disabled', async () => {
    const { user, input } = setup({ disabled: true });
    expect(input.disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(dialog()).toBeNull();
  });

  it('works as a controlled field with a forwarded ref, onBlur, and a hidden form value', async () => {
    const ref = createRef<HTMLInputElement>();
    const onBlur = vi.fn();
    const Controlled = () => {
      const [value, setValue] = useState<Date | null>(new Date(2025, 2, 1));
      return (
        <form aria-label='form'>
          <DatePicker ref={ref} aria-label='Due' now={NOW} value={value} onChange={setValue} onBlur={onBlur} name='due' />
          <button type='button' onClick={() => setValue(new Date(2026, 0, 5))}>
            set
          </button>
        </form>
      );
    };
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Due' });
    expect(ref.current).toBe(input);
    expect((container.querySelector('input[name="due"]') as HTMLInputElement).value).toBe('2025-03-01');

    await user.click(screen.getByRole('button', { name: 'set' }));
    expect((input as HTMLInputElement).value).toBe('2026-01-05');

    act(() => ref.current!.focus());
    await user.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('keeps Tab inside the popover', async () => {
    const { user, input } = setup();
    await user.click(input);
    const today = screen.getByRole('button', { name: 'Today' });
    const prev = screen.getByRole('button', { name: 'Previous month' });
    today.focus();
    await user.tab();
    expect(document.activeElement).toBe(prev);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(today);
  });

  it('keeps RTL on the portalled popover and flips horizontal arrows', async () => {
    const { user, input } = setup({ dir: 'rtl', defaultValue: new Date(2025, 2, 10) });
    await user.click(input);
    expect(dialog()!.getAttribute('dir')).toBe('rtl');
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(day('Tuesday, March 11, 2025'));
  });

  it('localises names and week start', async () => {
    const { user, input } = setup({ locale: 'fr-FR' });
    await user.click(input);
    expect(screen.getByText('mars 2025')).toBeTruthy();
    const headers = screen.getAllByRole('columnheader').map(h => h.getAttribute('aria-label'));
    expect(headers[0]).toBe('lundi');
  });

  it('falls back to the default format and warns once when dateFormat is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { input, rerender } = setup({ defaultValue: new Date(2025, 2, 10), dateFormat: 'yyyy-MM-dd j' });
    expect(input.value).toBe('2025-03-10');
    rerender(<DatePicker aria-label='Event date' now={NOW} defaultValue={new Date(2025, 2, 10)} dateFormat='yyyy-MM-dd j' />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"yyyy-MM-dd j"');
    warn.mockRestore();
  });

  it('treats an Invalid Date value as empty instead of throwing', async () => {
    const { user, input, container } = setup({ value: new Date('not a date'), name: 'due', showTime: true });
    expect(input.value).toBe('');
    expect((container.querySelector('input[name="due"]') as HTMLInputElement).value).toBe('');
    await user.click(input);
    expect(dialog()).not.toBeNull();
  });

  it('does not build day cells or call isDateUnavailable while closed', async () => {
    const isDateUnavailable = vi.fn(() => false);
    const { user, input, rerender } = setup({ isDateUnavailable });
    rerender(<DatePicker aria-label='Event date' now={NOW} onChange={() => {}} isDateUnavailable={isDateUnavailable} />);
    expect(isDateUnavailable).not.toHaveBeenCalled();
    await user.click(input);
    expect(isDateUnavailable).toHaveBeenCalled();
  });

  it('keeps the forwarded callback ref attached across re-renders', () => {
    const ref = vi.fn();
    const { rerender } = render(<DatePicker ref={ref} aria-label='Due' now={NOW} />);
    expect(ref).toHaveBeenCalledTimes(1);
    rerender(<DatePicker ref={ref} aria-label='Due' now={NOW} placeholder='changed' />);
    expect(ref).toHaveBeenCalledTimes(1);
  });

  it('renders on the server without touching the DOM', () => {
    const html = renderToString(<DatePicker aria-label='Server' now={NOW} defaultValue={new Date(2025, 2, 10)} />);
    expect(html).toContain('value="2025-03-10"');
    expect(html).not.toContain('role="dialog"');
  });
});
