// @vitest-environment jsdom
import { endOfDay } from 'date-fns';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from '../index';
import type { DateRangePickerProps } from '../index';

const NOW = new Date(2025, 2, 15, 10, 0);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const setup = (props: Partial<DateRangePickerProps> = {}) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<DateRangePicker aria-label='Period' now={NOW} onChange={onChange} {...props} />);
  const input = screen.getByRole('textbox', { name: 'Period' }) as HTMLInputElement;
  return { user, onChange, input };
};

const day = (label: string) => screen.getByRole('button', { name: label });
const dialog = () => screen.queryByRole('dialog');
const apply = () => screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement;
const titles = () => screen.getAllByRole('grid').map(g => g.getAttribute('aria-labelledby')).map(id => document.getElementById(id!)!.textContent);

describe('DateRangePicker', () => {
  it('picks a range and commits on Apply', async () => {
    const { user, input, onChange } = setup();
    await user.click(input);
    expect(titles()).toEqual(['March 2025', 'April 2025']);
    expect(apply().disabled).toBe(true);

    await user.click(day('Wednesday, March 5, 2025'));
    await user.click(day('Thursday, April 3, 2025'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('2025 Mar 5 - 2025 Apr 3')).toBeTruthy();

    await user.click(apply());
    expect(onChange).toHaveBeenCalledWith({ start: new Date(2025, 2, 5), end: endOfDay(new Date(2025, 3, 3)) });
    expect(dialog()).toBeNull();
    expect(input.value).toBe('2025 Mar 5 - 2025 Apr 3');
  });

  it('previews the range on hover', async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.click(day('Wednesday, March 5, 2025'));
    await user.hover(day('Monday, March 10, 2025'));
    expect(day('Friday, March 7, 2025').hasAttribute('data-preview')).toBe(true);
    expect(day('Tuesday, March 11, 2025').hasAttribute('data-in-range')).toBe(false);
  });

  it('Cancel and outside clicks discard the draft', async () => {
    const { user, input, onChange } = setup({
      defaultValue: { start: new Date(2025, 2, 1), end: endOfDay(new Date(2025, 2, 3)) },
    });
    await user.click(input);
    await user.click(day('Monday, March 10, 2025'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(input);
    expect(day('Sunday, March 2, 2025').hasAttribute('data-in-range')).toBe(true);
  });

  it('applies a preset', async () => {
    const { user, input, onChange } = setup({ presets: true });
    await user.click(input);
    const presets = within(screen.getByRole('group', { name: 'Presets' }));
    await user.click(presets.getByRole('button', { name: 'Last 7 Days' }));
    expect(presets.getByRole('button', { name: 'Last 7 Days' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(apply());
    expect(onChange).toHaveBeenCalledWith({ start: new Date(2025, 2, 9), end: endOfDay(NOW) });
  });

  it('autoApply commits as soon as the range is complete', async () => {
    const { user, input, onChange } = setup({ autoApply: true });
    await user.click(input);
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
    await user.click(day('Wednesday, March 5, 2025'));
    await user.click(day('Friday, March 7, 2025'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
  });

  it('applyDisabled blocks Apply', async () => {
    const { user, input } = setup({ applyDisabled: true });
    await user.click(input);
    await user.click(day('Wednesday, March 5, 2025'));
    await user.click(day('Friday, March 7, 2025'));
    expect(apply().disabled).toBe(true);
  });

  it('picking a month in the right calendar keeps both calendars in step (review #5)', async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'April 2025, Choose month' }));
    await user.click(screen.getByRole('button', { name: 'August' }));
    expect(titles()).toEqual(['July 2025', 'August 2025']);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(titles()).toEqual(['August 2025', 'September 2025']);
  });

  it('uses a one-month bottom sheet on small screens', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { user, input } = setup();
    await user.click(input);
    expect(dialog()!.getAttribute('data-layout')).toBe('sheet');
    expect(dialog()!.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.dp-backdrop')).not.toBeNull();
    expect(titles()).toEqual(['March 2025']);
    expect(document.documentElement.style.overflow).toBe('hidden');

    await user.pointer({ keys: '[MouseLeft]', target: document.querySelector('.dp-backdrop')! });
    expect(dialog()).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('posts an ISO interval through a hidden input', () => {
    const { container } = render(
      <DateRangePicker
        aria-label='Stay'
        now={NOW}
        name='stay'
        defaultValue={{ start: new Date(2025, 2, 1), end: new Date(2025, 2, 4) }}
      />,
    );
    expect((container.querySelector('input[name="stay"]') as HTMLInputElement).value).toBe('2025-03-01/2025-03-04');
  });
});
