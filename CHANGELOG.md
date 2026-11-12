# Changelog

All notable changes to `@mbanda1/date-picker` are listed here. The project follows [Semantic Versioning](https://semver.org).

## 1.0.0

1.0 is a rewrite that removes the Chakra UI dependency. The components keep the same purpose, but their names, props and styling have changed. See [Migrating from 0.x](./README.md#migrating-from-0x) for a prop-by-prop table.

### Breaking changes

- **No UI framework.** `@chakra-ui/react`, `@emotion/react`, `@emotion/styled` and `framer-motion` are no longer peer dependencies. Import `@mbanda1/date-picker/styles.css` once for the default look.
- **`date-fns` is a peer dependency.** 0.x bundled `date-fns` 2.19. Install `date-fns` 3 or 4 alongside the picker.
- **React 18 or later.** React 17 is no longer supported.
- **Renamed components.** `DatePickerInput` is now `DatePicker`, and `DateRangePickerInput` is now `DateRangePicker`.
- **Renamed props.**
  - `isDisabled`, `isRequired` and `isInvalid` are now `disabled`, `required` and `invalid`.
  - `showTimeSelect` is now `showTime`.
  - `showClearIcon` is now `clearable`.
  - `showPresets` is now `presets`.
  - `isLoading` is now `applyDisabled`.
- **Range values.** The range picker takes `value={{ start, end }}` and calls `onChange({ start, end })`. The separate `startDate` and `endDate` props are gone.
- **`defaultValue` means the starting value.** In 0.x it set the month to show. Use `defaultMonth` for that now. `defaultStartDate` is also replaced by `defaultMonth`.
- **Removed props.** `clearInput` is replaced by `onChange(null)` for a single date or `onChange({ start: null, end: null })` for a range. `size` and `variant` are replaced by CSS variables and classes. `onInputChange` is removed, because it was never called.
- **Range end time.** A range's end date is now set to the end of that day (23:59:59.999), so it includes events later on the last day.
- **Range order.** Clicking a day before the range start now makes a range from that day to the start. Before, the clicked day replaced the start and the range had no end.
- **Month picker.** A month is enabled if any of its days can be picked. Before, it was disabled when its first day was out of bounds.

### Added

- Bottom-sheet layout below 640px (`sheetBreakpoint`), with 44px tap targets and a one-month range picker. The page behind the sheet can't scroll while it's open.
- Full keyboard support and screen-reader labels, following the WAI-ARIA date picker dialog pattern. Focus stays inside the open picker and returns to the input when it closes.
- `@mbanda1/date-picker/headless`: `useDatePicker` and `useDateRangePicker` hooks for building pickers with your own markup.
- `@mbanda1/date-picker/core`: the framework-free state machine and calendar helpers (`createInitialState`, `transition`, `getDayCells`, …). It has no React dependency and no `'use client'` directive, so it can be used with other frameworks and in Server Components. `/headless` re-exports it too.
- Default stylesheet with `--dp-*` CSS variables. Every rule has zero specificity, so your own styles always win. Optional dark mode via `.dark` or `[data-theme='dark']`.
- `locale`: month names, weekday names and the first day of the week come from `Intl`.
- `dir` and right-to-left support.
- `name` renders a hidden input with an ISO value, for plain HTML forms and Next.js Server Actions.
- Controlled and uncontrolled use (`value` / `defaultValue`), with `ref`, `onBlur` and `name` forwarded so React Hook Form's `field` works directly.
- `now`, so the server and the browser agree on "today".
- `'use client'` is built in for the Next.js App Router.
- Custom range presets: pass an array to `presets`. `DEFAULT_RANGE_PRESETS` is exported to extend.
- `fixedWeeks`, `numberOfMonths`, `isDateUnavailable`, `labels` and `hour12`.
- ESM and CommonJS builds with type definitions, and an `exports` map.

### Fixed

- Picking a month or year from the 29th, 30th or 31st no longer jumps into the following month. For example, February picked from 31 January now shows February, not March.
- The year picker can now page forward to the year that contains `maxDate`.
- Clicking the calendar icon while the picker is open now closes it.
- Day buttons are no longer recreated on every render.
- After picking a month or year, the range picker's second calendar stays one month after the first.
- An invalid `dateFormat` string no longer crashes the page. The input falls back to the default format and logs a warning.

## 0.3.2 and earlier

Chakra UI based releases. See the [git history](https://github.com/mbanda1/date-picker/commits/main).
