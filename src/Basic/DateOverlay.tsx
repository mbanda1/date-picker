import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  getYear,
  isValid,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  format as formatDate,
} from 'date-fns';
import {
  ChevronDownSolid,
  ChevronLeftOutline,
  ChevronRightOutline,
} from '../components/icons';
import { DatePickerProps } from '../types';
import { THEME } from '../utils';

export const DateOverlay = ({
  value,
  onChange,
  defaultValue = new Date(),
  minDate,
  maxDate,
  isDisabled = false,
  showTodayButton = true,
  showTimeSelect = false,
  timeInterval = 30,
  minTime = '00:00',
  maxTime = '23:59',
}: DatePickerProps) => {
  // Normalize min and max dates to start/end of day
  const normalizedMinDate = minDate ? startOfDay(minDate) : undefined;
  const normalizedMaxDate = maxDate ? endOfDay(maxDate) : undefined;

  // State for internal date management
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // If value is provided and valid, use it
    if (value && isValid(value)) {
      return value;
    }

    // If defaultValue is provided, check if it's within min/max range
    if (defaultValue) {
      if (normalizedMinDate && isBefore(defaultValue, normalizedMinDate)) {
        return normalizedMinDate;
      }
      if (normalizedMaxDate && isAfter(defaultValue, normalizedMaxDate)) {
        return normalizedMaxDate;
      }
      return defaultValue;
    }

    // Otherwise use current date, respecting min/max
    const now = new Date();
    if (normalizedMinDate && isBefore(now, normalizedMinDate)) {
      return normalizedMinDate;
    }
    if (normalizedMaxDate && isAfter(now, normalizedMaxDate)) {
      return normalizedMaxDate;
    }
    return now;
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [yearRange, setYearRange] = useState(() => {
    const year = getYear(currentDate);
    const start = Math.floor(year / 12) * 12;
    return { start, end: start + 11 };
  });

  const [selectedTime, setSelectedTime] = useState<string | null>(
    value ? formatDate(value, 'HH:mm') : null,
  );
  const timeListRef = useRef<HTMLDivElement>(null);

  // Update internal state when external value changes
  useEffect(() => {
    if (value && isValid(value)) {
      setSelectedDate(value);
      setCurrentDate(value);
      setSelectedTime(formatDate(value, 'HH:mm'));
    } else if (value === null) {
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [value]);

  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Check if a date is within the allowed range
  const isDateInRange = useCallback(
    (date: Date): boolean => {
      if (normalizedMinDate && isBefore(date, normalizedMinDate)) {
        return false;
      }
      if (normalizedMaxDate && isAfter(date, normalizedMaxDate)) {
        return false;
      }
      return true;
    },
    [normalizedMinDate, normalizedMaxDate],
  );

  // Check if we can navigate to previous month
  const canNavigateToPrevMonth = useCallback(() => {
    if (!normalizedMinDate) return true;
    const prevMonth = subMonths(currentDate, 1);
    return !isBefore(endOfMonth(prevMonth), normalizedMinDate);
  }, [currentDate, normalizedMinDate]);

  // Check if we can navigate to next month
  const canNavigateToNextMonth = useCallback(() => {
    if (!normalizedMaxDate) return true;
    const nextMonth = addMonths(currentDate, 1);
    return !isAfter(startOfMonth(nextMonth), normalizedMaxDate);
  }, [currentDate, normalizedMaxDate]);

  // Check if we can navigate to previous year range
  const canNavigateToPrevYearRange = useCallback(() => {
    if (!normalizedMinDate) return true;
    return yearRange.start - 12 >= getYear(normalizedMinDate);
  }, [yearRange.start, normalizedMinDate]);

  // Check if we can navigate to next year range
  const canNavigateToNextYearRange = useCallback(() => {
    if (!normalizedMaxDate) return true;
    return yearRange.end + 1 <= getYear(normalizedMaxDate);
  }, [yearRange.end, normalizedMaxDate]);

  // Navigation functions - memoized for performance
  const nextMonth = useCallback(() => {
    if (canNavigateToNextMonth()) {
      setCurrentDate(date => addMonths(date, 1));
    }
  }, [canNavigateToNextMonth]);

  const prevMonth = useCallback(() => {
    if (canNavigateToPrevMonth()) {
      setCurrentDate(date => subMonths(date, 1));
    }
  }, [canNavigateToPrevMonth]);

  const nextYearRange = useCallback(() => {
    if (canNavigateToNextYearRange()) {
      setYearRange(({ end }) => {
        const newStart = end + 1;
        return {
          start: newStart,
          end: newStart + 11,
        };
      });
    }
  }, [canNavigateToNextYearRange]);

  const prevYearRange = useCallback(() => {
    if (canNavigateToPrevYearRange()) {
      setYearRange(({ start }) => {
        const newStart = start - 12;
        return {
          start: newStart,
          end: newStart + 11,
        };
      });
    }
  }, [canNavigateToPrevYearRange]);

  // Toggle between days, months, and years view
  const toggleViewMonths = useCallback(() => {
    setView(() => {
      return 'months';
    });
  }, [currentDate]);

  const toggleViewYears = useCallback(() => {
    setView(() => {
      const year = getYear(currentDate);
      const start = Math.floor(year / 12) * 12;
      setYearRange({ start, end: start + 11 });
      return 'years';
    });
  }, [currentDate]);
  // Select a date
  const handleDateSelect = useCallback(
    (date: Date) => {
      if (isDateInRange(date)) {
        setSelectedDate(date);
        setCurrentDate(date);
        if (!showTimeSelect) onChange?.(date);
      }
    },
    [onChange, isDateInRange],
  );

  // Check if a year is selectable
  const isYearSelectable = useCallback(
    (year: number): boolean => {
      if (normalizedMinDate && year < getYear(normalizedMinDate)) {
        return false;
      }
      if (normalizedMaxDate && year > getYear(normalizedMaxDate)) {
        return false;
      }
      return true;
    },
    [normalizedMinDate, normalizedMaxDate],
  );

  // Select a year
  const handleYearSelect = useCallback(
    (year: number) => {
      if (isYearSelectable(year)) {
        let newDate = new Date(currentDate);
        newDate.setFullYear(year);

        // Ensure the new date is within min/max range
        if (normalizedMinDate && isBefore(newDate, normalizedMinDate)) {
          newDate = new Date(normalizedMinDate);
        } else if (normalizedMaxDate && isAfter(newDate, normalizedMaxDate)) {
          newDate = new Date(normalizedMaxDate);
        }

        setCurrentDate(newDate);
        setView('days');
      }
    },
    [currentDate, normalizedMinDate, normalizedMaxDate, isYearSelectable],
  );

  // Select a month
  const handleMonthSelect = useCallback(
    (monthIndex: number) => {
      let newDate = new Date(currentDate);
      newDate.setMonth(monthIndex);

      // Ensure the new date is within min/max range
      if (normalizedMinDate && isBefore(newDate, normalizedMinDate)) {
        newDate = new Date(normalizedMinDate);
      } else if (normalizedMaxDate && isAfter(newDate, normalizedMaxDate)) {
        newDate = new Date(normalizedMaxDate);
      }

      setCurrentDate(newDate);
      setView('days');
    },
    [currentDate, normalizedMinDate, normalizedMaxDate],
  );

  // Generate days for the current month
  const generateDaysGrid = useCallback(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const blanks = Array(startDay).fill(null);

    return (
      <Box>
        <Grid templateColumns='repeat(7, 1fr)' mb={2}>
          {DAY_NAMES.map(day => (
            <Text
              key={day}
              textAlign='center'
              fontSize='sm'
              fontWeight='medium'
              color={THEME.dayTextColor}
            >
              {day}
            </Text>
          ))}
        </Grid>

        <Grid templateColumns='repeat(7, 1fr)' gap={1}>
          {blanks.map((_, index) => (
            <Box key={`blank-${index}`} p={2} />
          ))}

          {daysInMonth.map(day => {
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate
              ? isSameDay(day, selectedDate)
              : false;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isInRange = isDateInRange(day);
            const isDateDisabled = isDisabled || !isInRange;

            return (
              <Button
                key={day.toISOString()}
                size='sm'
                variant='unstyled'
                onClick={() => handleDateSelect(day)}
                display='flex'
                alignItems='center'
                justifyContent='center'
                p={2}
                bg={isSelected ? THEME.selectedBgColor : 'transparent'}
                color={
                  isSelected
                    ? THEME.selectedTextColor
                    : isDateDisabled
                    ? THEME.disabledTextColor
                    : THEME.dayTextColor
                }
                border={
                  isToday && !isSelected ? '1px solid' : '1px solid transparent'
                }
                borderColor={
                  isToday && !isSelected
                    ? THEME.todayBorderColor
                    : 'transparent'
                }
                opacity={isCurrentMonth ? 1 : 0.5}
                _hover={
                  !isSelected && !isDateDisabled ? { bg: THEME.hoverColor } : {}
                }
                isDisabled={isDateDisabled}
                cursor={isDateDisabled ? 'not-allowed' : 'pointer'}
              >
                {format(day, 'd')}
              </Button>
            );
          })}
        </Grid>
      </Box>
    );
  }, [currentDate, selectedDate, handleDateSelect, isDisabled, isDateInRange]);

  // Generate months grid
  const generateMonthsGrid = useCallback(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = getYear(currentDate);

    return (
      <Box>
        <Grid templateColumns='repeat(3, 1fr)' gap={2}>
          {MONTHS.map((month, index) => {
            const isCurrentMonth =
              currentMonth === index && getYear(new Date()) === currentYear;
            const monthDate = new Date(currentYear, index, 1);
            const isMonthDisabled = isDisabled || !isDateInRange(monthDate);

            return (
              <Button
                key={month}
                size='sm'
                variant='unstyled'
                onClick={() => handleMonthSelect(index)}
                display='flex'
                alignItems='center'
                justifyContent='center'
                borderRadius='md'
                p={2}
                bg={isCurrentMonth ? THEME.selectedBgColor : 'transparent'}
                color={
                  isCurrentMonth
                    ? THEME.selectedTextColor
                    : isMonthDisabled
                    ? THEME.disabledTextColor
                    : THEME.dayTextColor
                }
                _hover={
                  !isCurrentMonth && !isMonthDisabled
                    ? { bg: THEME.hoverColor }
                    : {}
                }
                height='36px'
                isDisabled={isMonthDisabled}
                cursor={isMonthDisabled ? 'not-allowed' : 'pointer'}
              >
                {month}
              </Button>
            );
          })}
        </Grid>
      </Box>
    );
  }, [currentDate, isDisabled, isDateInRange, handleMonthSelect]);

  // Generate years grid
  const generateYearsGrid = useCallback(() => {
    const years = Array.from({ length: 12 }, (_, i) => yearRange.start + i);
    const currentYear = getYear(currentDate);

    return (
      <Box>
        <Grid templateColumns='repeat(3, 1fr)' gap={2}>
          {years.map(year => {
            const isCurrentYear = currentYear === year;
            const isYearDisabled = isDisabled || !isYearSelectable(year);

            return (
              <Button
                key={year}
                size='sm'
                variant='unstyled'
                onClick={() => handleYearSelect(year)}
                display='flex'
                alignItems='center'
                justifyContent='center'
                borderRadius='md'
                p={2}
                bg={isCurrentYear ? THEME.selectedBgColor : 'transparent'}
                color={
                  isCurrentYear
                    ? THEME.selectedTextColor
                    : isYearDisabled
                    ? THEME.disabledTextColor
                    : THEME.dayTextColor
                }
                _hover={
                  !isCurrentYear && !isYearDisabled
                    ? { bg: THEME.hoverColor }
                    : {}
                }
                height='36px'
                isDisabled={isYearDisabled}
                cursor={isYearDisabled ? 'not-allowed' : 'pointer'}
              >
                {year}
              </Button>
            );
          })}
        </Grid>
      </Box>
    );
  }, [yearRange, currentDate, handleYearSelect, isDisabled, isYearSelectable]);

  const combineDateAndTime = useCallback(
    (date: Date, timeString: string): Date => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return setMinutes(setHours(date, hours), minutes);
    },
    [],
  );

  // Handle time selection
  const handleTimeSelect = useCallback(
    (timeString: string) => {
      setSelectedTime(timeString);

      if (selectedDate) {
        const dateTime = combineDateAndTime(selectedDate, timeString);
        onChange?.(dateTime);
      }
    },
    [selectedDate, onChange, combineDateAndTime],
  );

  // Generate time options based on interval
  const generateTimeOptions = useCallback(() => {
    const options: { value: string; displayText: string }[] = [];
    const [minHours, minMinutes] = minTime.split(':').map(Number);
    const [maxHours, maxMinutes] = maxTime.split(':').map(Number);

    const startMinutes = minHours * 60 + minMinutes;
    const endMinutes = maxHours * 60 + maxMinutes;

    for (let i = startMinutes; i <= endMinutes; i += timeInterval) {
      const hours = Math.floor(i / 60);
      const minutes = i % 60;

      const period = hours >= 12 ? 'pm' : 'am';
      const hours12 = hours % 12 || 12;
      const formatted = `${hours12}:${minutes
        .toString()
        .padStart(2, '0')} ${period}`;

      options.push({
        value: `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}`,
        displayText: formatted,
      });
    }

    return options;
  }, [minTime, maxTime, timeInterval]);

  // Check if today button should be disabled
  const isTodayDisabled = useCallback(() => {
    const today = new Date();
    return !isDateInRange(today);
  }, [isDateInRange]);

  // Select today
  const handleSelectToday = useCallback(() => {
    const today = new Date();
    if (isDateInRange(today)) {
      setSelectedDate(today);
      setCurrentDate(today);
      setView('days');
      if (!showTimeSelect) onChange?.(today);
    }
  }, [onChange, isDateInRange]);

  // Scroll to selected time
  useEffect(() => {
    if (timeListRef.current && selectedTime) {
      const selectedElement = timeListRef.current.querySelector(
        `[data-time="${selectedTime}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedTime, showTimeSelect]);

  // Time selection component
  const TimeSelector = useCallback(() => {
    const timeOptions = generateTimeOptions();
    const formattedDate = value
      ? format(new Date(value), 'EEEE, MMMM, yyyy')
      : format(selectedDate, 'EEEE, MMMM, yyyy');

    return (
      <Box
        maxHeight='220px'
        overflowY='auto'
        borderLeft='1px solid'
        borderColor='gray.200'
        pl={4}
        ref={timeListRef}
      >
        <Text fontWeight='medium' mb={2}>
          {formattedDate}
        </Text>
        <Stack spacing={1}>
          {timeOptions.map(time => (
            <Button
              key={time.value}
              size='sm'
              variant='ghost'
              data-time={time.value}
              onClick={() => handleTimeSelect(time?.value)}
              bg={
                selectedTime === time.value
                  ? THEME.selectedBgColor
                  : 'transparent'
              }
              color={
                selectedTime === time.value
                  ? THEME.selectedTextColor
                  : THEME.dayTextColor
              }
              _hover={{
                bg:
                  selectedTime === time.value
                    ? THEME.selectedBgColor
                    : THEME.hoverColor,
              }}
              isDisabled={isDisabled}
            >
              {time.displayText}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }, [generateTimeOptions, handleTimeSelect, selectedTime, isDisabled]);

  const renderCalendarHeader = () => {
    const isMonthsView = view === 'months';
    const isDaysView = view === 'days';

    const prevDisabled =
      isDisabled ||
      (isDaysView
        ? !canNavigateToPrevMonth()
        : isMonthsView
        ? normalizedMinDate &&
          getYear(currentDate) - 1 < getYear(normalizedMinDate)
        : !canNavigateToPrevYearRange());

    const nextDisabled =
      isDisabled ||
      (isDaysView
        ? !canNavigateToNextMonth()
        : isMonthsView
        ? normalizedMaxDate &&
          getYear(currentDate) + 1 > getYear(normalizedMaxDate)
        : !canNavigateToNextYearRange());

    const handlePrev = isDaysView
      ? prevMonth
      : isMonthsView
      ? () => {
          // Navigate to previous year when in months view
          const prevYear = getYear(currentDate) - 1;
          if (!normalizedMinDate || prevYear >= getYear(normalizedMinDate)) {
            setCurrentDate(new Date(prevYear, 0, 1));
          }
        }
      : prevYearRange;

    const handleNext = isDaysView
      ? nextMonth
      : isMonthsView
      ? () => {
          // Navigate to next year when in months view
          const nextYear = getYear(currentDate) + 1;
          if (!normalizedMaxDate || nextYear <= getYear(normalizedMaxDate)) {
            setCurrentDate(new Date(nextYear, 0, 1));
          }
        }
      : nextYearRange;

    // Display month and year horizontally with proper navigation
    const headerText = (
      <Flex alignItems='center' gap={8}>
        <Button
          variant='ghost'
          onClick={toggleViewMonths}
          fontWeight='medium'
          isDisabled={isDisabled}
          rightIcon={<ChevronDownSolid />}
          color='navy'
          size='sm'
          mx={2}
        >
          {format(currentDate, 'MMM')}
        </Button>

        <Button
          variant='ghost'
          onClick={toggleViewYears}
          fontWeight='medium'
          isDisabled={isDisabled}
          rightIcon={<ChevronDownSolid />}
          color='navy'
          size='sm'
          mx={2}
        >
          {format(currentDate, 'yyyy')}
        </Button>
      </Flex>
    );

    return (
      <Flex justifyContent='space-between' alignItems='center' mb={4}>
        <IconButton
          aria-label={
            isDaysView
              ? 'Previous month'
              : isMonthsView
              ? 'Previous year'
              : 'Previous years'
          }
          icon={<ChevronLeftOutline size={18} color='navy' />}
          size='sm'
          variant='ghost'
          onClick={handlePrev}
          isDisabled={prevDisabled}
        />

        {headerText}

        <IconButton
          aria-label={
            isDaysView
              ? 'Next month'
              : isMonthsView
              ? 'Next year'
              : 'Next years'
          }
          icon={<ChevronRightOutline size={18} color='navy' />}
          size='sm'
          variant='ghost'
          onClick={handleNext}
          isDisabled={nextDisabled}
        />
      </Flex>
    );
  };

  /* Calendar body */
  return (
    <Stack bg={'white'} borderRadius='lg' boxShadow='lg' p={4}>
      {renderCalendarHeader()}

      <Flex width='100%'>
        <Box flex='1'>
          {view === 'days'
            ? generateDaysGrid()
            : view === 'months'
            ? generateMonthsGrid()
            : generateYearsGrid()}
        </Box>

        {showTimeSelect && selectedDate && view === 'days' && <TimeSelector />}
      </Flex>

      <Flex justifyContent='space-between' mt={4}>
        {showTodayButton && (
          <Button
            size='sm'
            variant='ghost'
            onClick={handleSelectToday}
            isDisabled={isDisabled || isTodayDisabled()}
          >
            Today
          </Button>
        )}
      </Flex>
    </Stack>
  );
};
