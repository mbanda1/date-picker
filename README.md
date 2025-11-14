# @mbanda1/datepicker

Accessible Chakra UI date pickers for single dates and ranges, built with React, React Hook Form 7, and `date-fns`. Every component ships fully typed, themable, and ready to publish on npm.

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

### React Hook Form 7 integration

```tsx
import { useForm } from 'react-hook-form';
import { DatePickerInputHookForm7 } from '@mbanda1/datepicker';

type FormValues = { eventDate: Date | null };

export function BookingForm() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { eventDate: null } });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <DatePickerInputHookForm7
        name='eventDate'
        control={control}
        label='Event date'
        helperText='Pick any weekday between 9 AM and 4:30 PM'
        error={errors.eventDate}
        isRequired
        showTimeSelect
        timeInterval={120}
        minTime='09:00'
        maxTime='16:30'
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

> Need the range picker in React Hook Form? Wrap `DateRangePickerInput` in a `Controller` and forward `value`/`onChange` manually (see “Range picker + RHF” below).

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
| `showTodayButton` | `boolean` | `true` | Toggles the “Today” shortcut. |
| `showTimeSelect` | `boolean` | `false` | Enables the time list beneath the calendar. |
| `timeInterval` | `number` | `30` | Minutes between time options. |
| `minTime` / `maxTime` | `string (HH:mm)` | `'00:00'` / `'23:59'` | Bounds the selectable time window. |
| `isDisabled` / `isRequired` / `isInvalid` | `boolean` | `false` | Chakra input states. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Chakra input size. |
| `variant` | `'outline' \| 'filled' \| 'flushed' \| 'unstyled'` | `'outline'` | Chakra input variant. |
| `showClearIcon` | `boolean` | `true` | Display the inline clear control. |
| `clearInput` | `() => void` | `undefined` | Notified when the clear icon is clicked. |

### `DatePickerInputHookForm7`

Wraps `DatePickerInput` inside a Chakra `FormControl` and a `react-hook-form` `Controller`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `FieldPath<T>` | **required** | Form field name. |
| `control` | `Control<T>` | **required** | RHF control instance. |
| `rules` | `RegisterOptions<T>` | `undefined` | Validation rules. |
| `label` | `string` | `undefined` | Optional Chakra `FormLabel`. |
| `helperText` | `string` | `undefined` | Renders under the field when no error. |
| `error` | `FieldError` | `undefined` | Drives `isInvalid` and `FormErrorMessage`. |
| `showError` | `boolean` | `true` | Hide the error message while retaining state. |
| `isRequired` | `boolean` | `false` | Mirrors Chakra prop + adds asterisk. |
| `placeholder` | `string` | `'dd/mm/yyyy'` | Overrides the input placeholder. |
| `...rest` | `DatePickerInput` props | — | Passed down after removing `value`/`onChange`. |

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

## Theming & tokens

The pickers are Chakra components, so they inherit your global tokens automatically. For finer control, you can import the exported `THEME` map and override it before rendering:

```ts
import { THEME } from '@mbanda1/datepicker';

THEME.selectedBgColor = 'purple.500';
THEME.dayTextColor = 'gray.700';
```

> `THEME` is a mutable object used by both single and range overlays; adjust it in a module that runs once (e.g., where you set up your Chakra provider).

## License

MIT © mbanda1

