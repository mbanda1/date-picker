# @mbanda1/datepicker

Accessible Chakra UI date pickers for single dates and ranges, built with React, React Hook Form 7, and `date-fns`. Every component ships fully typed and themable.

## Features
- Chakra-first API that plays nicely with your design tokens.
- Controlled single-date picker with optional time selection.
- Built-in React Hook Form 7 wrapper for effortless validation.
- Date-range picker with sticky action bar and optional preset column.
- Tree-shakeable TypeScript build (`cjs`, `esm`, and `d.ts`).

## Installation

```bash
pnpm add @mbanda1/datepicker
# or
npm install @mbanda1/datepicker
```

Peer dependencies:

- `react >= 17`, `react-dom >= 17`
- `@chakra-ui/react >= 1.0.3`
- `framer-motion` and `@emotion/*` (required by Chakra)
- `react-hook-form >= 7` (only if you use the hook-form wrapper)

## Quick Start

### Basic controlled picker

```tsx
import { useState } from 'react';
import { DatePickerInput } from '@mbanda1/datepicker';

export function EventDateField() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <DatePickerInput
      value={date}
      onChange={setDate}
      placeholder='Select a date'
      dateFormat='MMMM d, yyyy'
      minDate={new Date()}
      showTimeSelect
      timeInterval={60}
      minTime='09:00'
      maxTime='18:00'
    />
  );
}
```

![DatePicker Example](https://drive.google.com/file/d/1n9apjcWBkJ9UwQqOonbOlWT1erl6rbMi/view?usp=sharing)


### React Hook Form 7 integration

```tsx
import { useForm } from 'react-hook-form';

type FormValues = { eventDate: Date | null };

export function BookingForm() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { eventDate: null } });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      
        <Controller
    control={control}
    name='date'
    render={({ field }) => (
      <DatePickerInput
        {...field}
        placeholder='Select a date'
        dateFormat='MMMM d, yyyy'
      />
    )}
  />
    </form>
  );
}
```

### Date range picker

```tsx
import { useState } from 'react';
import { DateRangePickerInput } from '@mbanda1/datepicker';

export function RangeFilter() {
  const [range, setRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });

  return (
      <DateRangePickerInput
      startDate={range.startDate}
      endDate={range.endDate}
      onChange={setRange}
      dateFormat='yyyy-MM-dd'
      placeholder='Select period'
      showPresets
      clearInput={() => setRange({ startDate: null, endDate: null })}
    />
  );
}
```


> Need the range picker in React Hook Form? Wrap `DateRangePickerInput` in a `Controller` and forward `value`/`onChange` manually (see "Range picker + RHF" below).


![Date Range Example](https://drive.google.com/file/d/1zwmvssj7IbV94OXK0dw5B5Qo2FBlO5Bp/view?usp=sharing)

## API Reference

### `DatePickerInput`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date \| null` | `undefined` | Controlled value. |
| `onChange` | `(date: Date \| null) => void` | `undefined` | Fires with the selected date or `null`. |
| `defaultValue` | `Date` | `new Date()` | Starting date when no value is supplied. |
| `minDate` / `maxDate` | `Date` | `undefined` | Bounds selection (inclusive, normalized to start/end of day). |
| `placeholder` | `string` | `'Select date'` | Input placeholder. |
| `dateFormat` | `string` | `'yyyy-MM-dd'` | `date-fns` compatible format string. |
| `showTodayButton` | `boolean` | `true` | Toggles the "Today" shortcut. |
| `showTimeSelect` | `boolean` | `false` | Enables the time list beneath the calendar. |
| `timeInterval` | `number` | `30` | Minutes between time options. |
| `minTime` / `maxTime` | `string (HH:mm)` | `'00:00'` / `'23:59'` | Bounds the selectable time window. |
| `isDisabled` / `isRequired` / `isInvalid` | `boolean` | `false` | Chakra input states. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Chakra input size. |
| `variant` | `'outline' \| 'filled' \| 'flushed' \| 'unstyled'` | `'outline'` | Chakra input variant. |
| `showClearIcon` | `boolean` | `true` | Display the inline clear control. |
| `clearInput` | `() => void` | `undefined` | Notified when the clear icon is clicked. |

### `DateRangePickerInput`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `startDate` / `endDate` | `Date \| null` | `undefined` | Controlled range values. |
| `onChange` | `(range: { startDate: Date \| null; endDate: Date \| null }) => void` | `undefined` | Receives local selections when Apply is clicked or when cleared. |
| `defaultStartDate` | `Date` | `new Date()` | Initial month focus if no `startDate`. |
| `minDate` / `maxDate` | `Date` | `undefined` | Bounds both calendars. |
| `placeholder` | `string` | `'Select date range...'` | Input placeholder. |
| `dateFormat` | `string` | `'yyyy MMM d'` | Format applied to both dates. |
| `isDisabled` / `isRequired` / `isInvalid` | `boolean` | `false` | Chakra input states. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Chakra input size. |
| `variant` | `'outline' \| 'filled' \| 'flushed' \| 'unstyled'` | `'outline'` | Chakra input variant. |
| `showClearIcon` | `boolean` | `true` | Display the inline clear control. |
| `clearInput` | `() => void` | `undefined` | Called when the user clears the selection. |
| `showPresets` | `boolean` | `false` | Adds the preset column on the left. |
| `isLoading` | `boolean` | `false` | Disables the Apply button while loading. |

### Range picker + React Hook Form (manual)

```tsx
<Controller
  name='dateRange'
  control={control}
  render={({ field: { value, onChange } }) => (
    <DateRangePickerInput
      startDate={value?.startDate ?? null}
      endDate={value?.endDate ?? null}
      onChange={onChange}
      showPresets
    />
  )}
/>;
```

## License

MIT © mbanda1
