import { useState } from 'react';
import { Button, Stack } from '@chakra-ui/react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';

interface DateRangeProps {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePresetsProps {
  onSelectRange: (range: DateRangeProps) => void;
}

// Define preset options
const presets = [
  {
    label: 'Today',
    getRange: () => {
      const today = new Date();
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      };
    },
  },
  {
    label: 'Yesterday',
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    },
  },
  {
    label: 'This Week',
    getRange: () => {
      const today = new Date();
      return {
        startDate: startOfWeek(today, { weekStartsOn: 0 }),
        endDate: endOfWeek(today, { weekStartsOn: 0 }),
      };
    },
  },
  {
    label: 'Last Week',
    getRange: () => {
      const lastWeekStart = subDays(
        startOfWeek(new Date(), { weekStartsOn: 0 }),
        7,
      );
      const lastWeekEnd = subDays(
        endOfWeek(new Date(), { weekStartsOn: 0 }),
        7,
      );
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
      };
    },
  },
  {
    label: 'Last 7 Days',
    getRange: () => {
      const today = new Date();
      return {
        startDate: startOfDay(subDays(today, 6)),
        endDate: endOfDay(today),
      };
    },
  },
  {
    label: 'This Month',
    getRange: () => {
      const today = new Date();
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today),
      };
    },
  },
  {
    label: 'Last 3 Months',
    getRange: () => {
      const today = new Date();
      return {
        startDate: startOfDay(subMonths(today, 3)),
        endDate: endOfDay(today),
      };
    },
  },
  {
    label: 'This Year',
    getRange: () => {
      const today = new Date();
      return {
        startDate: startOfYear(today),
        endDate: endOfYear(today),
      };
    },
  },
  {
    label: 'Last Year',
    getRange: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear),
      };
    },
  },
];

export default function DateRangePresets({
  onSelectRange,
}: DateRangePresetsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const range = preset.getRange();
    onSelectRange(range);
    setActivePreset(preset.label);
  };

  return (
    <Stack spacing={1} h='100%'>
      {presets.map(preset => (
        <Button
          key={preset.label}
          size='sm'
          variant={activePreset === preset.label ? 'solid' : 'ghost'}
          color={activePreset === preset.label ? 'white' : 'charcoal'}
          justifyContent='center'
          onClick={() => handlePresetClick(preset)}
          ml={2}
          mr={2}
        >
          {preset.label}
        </Button>
      ))}
    </Stack>
  );
}
