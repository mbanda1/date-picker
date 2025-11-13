import { useCallback, useEffect, useState, useMemo } from 'react';
import { Box, Button, Flex, Grid, IconButton, Text } from '@chakra-ui/react';
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
  isWithinInterval,
  addYears,
  subYears,
} from 'date-fns';
import {
  ChevronDownSolid,
  ChevronLeftOutline,
  ChevronRightOutline,
} from '../components/icons';
import { DateRangePickerProps } from '../types';
import { THEME } from '../utils';

// Types

type CalendarView = 'days' | 'months' | 'years';
type SelectionPhase = 'start' | 'end';
type SpecialView = 'left' | 'right' | null;
type YearRange = { start: number; end: number };

// Helper functions
const normalizeDate = (
  date: Date | undefined,
  isEnd = false,
): Date | undefined => {
  if (!date) return undefined;
  return isEnd ? endOfDay(date) : startOfDay(date);
};

const getYearRange = (date: Date): YearRange => {
  const year = getYear(date);
  const start = Math.floor(year / 12) * 12;
  return { start, end: start + 11 };
};

export const DateRangeOverlay = ({
  startDate,
  endDate,
  onChange,
  defaultStartDate = new Date(),
  minDate,
  maxDate,
  isDisabled = false,
}: DateRangePickerProps) => {
  // Normalize min and max dates
  const normalizedMinDate = useMemo(() => normalizeDate(minDate), [minDate]);
  const normalizedMaxDate = useMemo(
    () => normalizeDate(maxDate, true),
    [maxDate],
  );

  // Initialize left calendar date
  const initLeftDate = useMemo(() => {
    if (startDate && isValid(startDate)) return startDate;

    if (defaultStartDate) {
      if (normalizedMinDate && isBefore(defaultStartDate, normalizedMinDate)) {
        return normalizedMinDate;
      }
      if (normalizedMaxDate && isAfter(defaultStartDate, normalizedMaxDate)) {
        return normalizedMaxDate;
      }
      return defaultStartDate;
    }

    const now = new Date();
    if (normalizedMinDate && isBefore(now, normalizedMinDate)) {
      return normalizedMinDate;
    }
    if (normalizedMaxDate && isAfter(now, normalizedMaxDate)) {
      return normalizedMaxDate;
    }
    return now;
  }, [startDate, defaultStartDate, normalizedMinDate, normalizedMaxDate]);

  // State
  const [leftCurrentDate, setLeftCurrentDate] = useState<Date>(initLeftDate);
  const [rightCurrentDate, setRightCurrentDate] = useState<Date>(() =>
    addMonths(initLeftDate, 1),
  );
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    startDate || null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    endDate || null,
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>(
    startDate ? 'end' : 'start',
  );
  const [leftView, setLeftView] = useState<CalendarView>('days');
  const [rightView, setRightView] = useState<CalendarView>('days');
  const [leftYearRange, setLeftYearRange] = useState<YearRange>(() =>
    getYearRange(initLeftDate),
  );
  const [rightYearRange, setRightYearRange] = useState<YearRange>(() =>
    getYearRange(addMonths(initLeftDate, 1)),
  );
  const [activeSpecialView, setActiveSpecialView] = useState<SpecialView>(null);

  // Sync with external props
  useEffect(() => {
    if (startDate && isValid(startDate)) {
      setSelectedStartDate(startDate);
      setSelectionPhase('end');
    } else if (startDate === null) {
      setSelectedStartDate(null);
      setSelectionPhase('start');
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate && isValid(endDate)) {
      setSelectedEndDate(endDate);
    } else if (endDate === null) {
      setSelectedEndDate(null);
    }
  }, [endDate]);

  // Keep right calendar in sync with left
  useEffect(() => {
    setRightCurrentDate(addMonths(leftCurrentDate, 1));
  }, [leftCurrentDate]);

  // Navigation constraints
  const canNavigate = useMemo(() => {
    const prevMonth = subMonths(leftCurrentDate, 1);
    const nextMonth = addMonths(rightCurrentDate, 1);
    const prevYear = subYears(leftCurrentDate, 1);
    const nextYear = addYears(rightCurrentDate, 1);

    return {
      prevMonth:
        !normalizedMinDate ||
        !isBefore(endOfMonth(prevMonth), normalizedMinDate),
      nextMonth:
        !normalizedMaxDate ||
        !isAfter(startOfMonth(nextMonth), normalizedMaxDate),
      prevYear: !normalizedMinDate || !isBefore(prevYear, normalizedMinDate),
      nextYear: !normalizedMaxDate || !isAfter(nextYear, normalizedMaxDate),
      prevYearRange:
        !normalizedMinDate ||
        getYear(normalizedMinDate) <= leftYearRange.start - 12,
      nextYearRange:
        !normalizedMaxDate ||
        getYear(normalizedMaxDate) >= leftYearRange.end + 12,
    };
  }, [
    leftCurrentDate,
    rightCurrentDate,
    normalizedMinDate,
    normalizedMaxDate,
    leftYearRange,
  ]);

  // Date validation
  const isDateInRange = useCallback(
    (date: Date): boolean => {
      if (normalizedMinDate && isBefore(date, normalizedMinDate)) return false;
      if (normalizedMaxDate && isAfter(date, normalizedMaxDate)) return false;
      return true;
    },
    [normalizedMinDate, normalizedMaxDate],
  );

  const isYearSelectable = useCallback(
    (year: number): boolean => {
      if (normalizedMinDate && year < getYear(normalizedMinDate)) return false;
      if (normalizedMaxDate && year > getYear(normalizedMaxDate)) return false;
      return true;
    },
    [normalizedMinDate, normalizedMaxDate],
  );

  // Navigation handlers
  const handleNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      if (activeSpecialView) {
        const view = activeSpecialView === 'left' ? leftView : rightView;
        // const currentDate =
        //   activeSpecialView === 'left' ? leftCurrentDate : rightCurrentDate;

        if (view === 'months') {
          if (direction === 'prev' && canNavigate.prevYear) {
            activeSpecialView === 'left'
              ? setLeftCurrentDate(date => subYears(date, 1))
              : setRightCurrentDate(date => subYears(date, 1));
          } else if (direction === 'next' && canNavigate.nextYear) {
            activeSpecialView === 'left'
              ? setLeftCurrentDate(date => addYears(date, 1))
              : setRightCurrentDate(date => addYears(date, 1));
          }
        } else if (view === 'years') {
          if (direction === 'prev' && canNavigate.prevYearRange) {
            activeSpecialView === 'left'
              ? setLeftYearRange(range => ({
                  start: range.start - 12,
                  end: range.end - 12,
                }))
              : setRightYearRange(range => ({
                  start: range.start - 12,
                  end: range.end - 12,
                }));
          } else if (direction === 'next' && canNavigate.nextYearRange) {
            activeSpecialView === 'left'
              ? setLeftYearRange(range => ({
                  start: range.start + 12,
                  end: range.end + 12,
                }))
              : setRightYearRange(range => ({
                  start: range.start + 12,
                  end: range.end + 12,
                }));
          }
        }
      } else {
        if (direction === 'prev' && canNavigate.prevMonth) {
          setLeftCurrentDate(date => subMonths(date, 1));
        } else if (direction === 'next' && canNavigate.nextMonth) {
          setLeftCurrentDate(date => addMonths(date, 1));
        }
      }
    },
    [
      activeSpecialView,
      leftView,
      rightView,
      leftCurrentDate,
      rightCurrentDate,
      canNavigate,
    ],
  );

  // View toggle handlers
  const toggleView = useCallback(
    (side: 'left' | 'right') => {
      if (side === 'left') {
        if (leftView === 'days') {
          setLeftView('months');
          setActiveSpecialView('left');
        } else if (leftView === 'months') {
          setLeftYearRange(getYearRange(leftCurrentDate));
          setLeftView('years');
          setActiveSpecialView('left');
        } else {
          setLeftView('days');
          setActiveSpecialView(null);
        }
      } else {
        if (rightView === 'days') {
          setRightView('months');
          setActiveSpecialView('right');
        } else if (rightView === 'months') {
          setRightYearRange(getYearRange(rightCurrentDate));
          setRightView('years');
          setActiveSpecialView('right');
        } else {
          setRightView('days');
          setActiveSpecialView(null);
        }
      }
    },
    [leftView, rightView, leftCurrentDate, rightCurrentDate],
  );

  // Date selection handlers
  const handleDateSelect = useCallback(
    (date: Date) => {
      if (!isDateInRange(date)) return;

      if (selectionPhase === 'start') {
        // Starting a new selection
        setSelectedStartDate(date);
        setSelectedEndDate(null);
        setSelectionPhase('end');
        onChange?.({ startDate: date, endDate: null });
      } else {
        // We're in the 'end' phase
        if (selectedStartDate) {
          // If the selected date is before the current startDate
          if (isBefore(date, selectedStartDate)) {
            // Make the selected date the new startDate, keep the current endDate
            setSelectedStartDate(date);
            onChange?.({ startDate: date, endDate: selectedEndDate });
            // Exit the overlay by resetting to 'start' phase
            setSelectionPhase('start');
          }
          // If the selected date is after the current startDate
          else {
            // Set it as the endDate
            setSelectedEndDate(date);
            onChange?.({ startDate: selectedStartDate, endDate: date });
            // Exit the overlay by resetting to 'start' phase
            setSelectionPhase('start');
          }
        } else {
          // If somehow we don't have a startDate in the 'end' phase
          setSelectedStartDate(date);
          setSelectionPhase('end');
          onChange?.({ startDate: date, endDate: null });
        }
      }
    },
    [
      onChange,
      isDateInRange,
      selectionPhase,
      selectedStartDate,
      selectedEndDate,
    ],
  );

  const handleDateHover = useCallback(
    (date: Date) => {
      if (selectionPhase === 'end' && selectedStartDate) {
        setHoverDate(date);
      }
    },
    [selectionPhase, selectedStartDate],
  );

  // Month and year selection handlers
  const handleMonthSelect = useCallback(
    (side: 'left' | 'right', monthIndex: number) => {
      if (side === 'left') {
        let newDate = new Date(leftCurrentDate);
        newDate.setMonth(monthIndex);

        if (normalizedMinDate && isBefore(newDate, normalizedMinDate)) {
          newDate = new Date(normalizedMinDate);
        } else if (normalizedMaxDate && isAfter(newDate, normalizedMaxDate)) {
          newDate = new Date(normalizedMaxDate);
        }

        setLeftCurrentDate(newDate);
        setLeftView('days');
        setActiveSpecialView(null);
      } else {
        let newDate = new Date(rightCurrentDate);
        newDate.setMonth(monthIndex);

        if (normalizedMinDate && isBefore(newDate, normalizedMinDate)) {
          newDate = new Date(normalizedMinDate);
        } else if (normalizedMaxDate && isAfter(newDate, normalizedMaxDate)) {
          newDate = new Date(normalizedMaxDate);
        }

        if (
          isBefore(
            new Date(newDate.getFullYear(), newDate.getMonth(), 1),
            new Date(
              leftCurrentDate.getFullYear(),
              leftCurrentDate.getMonth() + 1,
              1,
            ),
          )
        ) {
          setLeftCurrentDate(
            new Date(newDate.getFullYear(), newDate.getMonth() - 1, 1),
          );
        }

        setRightCurrentDate(newDate);
        setRightView('days');
        setActiveSpecialView(null);
      }
    },
    [leftCurrentDate, rightCurrentDate, normalizedMinDate, normalizedMaxDate],
  );

  const handleYearSelect = useCallback(
    (side: 'left' | 'right', year: number) => {
      if (!isYearSelectable(year)) return;

      if (side === 'left') {
        let newDate = new Date(leftCurrentDate);
        newDate.setFullYear(year);

        if (normalizedMinDate && isBefore(newDate, normalizedMinDate)) {
          newDate = new Date(normalizedMinDate);
        } else if (normalizedMaxDate && isAfter(newDate, normalizedMaxDate)) {
          newDate = new Date(normalizedMaxDate);
        }

        setLeftCurrentDate(newDate);
        setLeftView('days');
        setActiveSpecialView(null);
      } else {
        if (selectedStartDate && year < getYear(selectedStartDate)) return;

        let newDate = new Date(rightCurrentDate);
        newDate.setFullYear(year);

        if (normalizedMinDate && isBefore(newDate, normalizedMinDate)) {
          newDate = new Date(normalizedMinDate);
        } else if (normalizedMaxDate && isAfter(newDate, normalizedMaxDate)) {
          newDate = new Date(normalizedMaxDate);
        }

        if (isBefore(newDate, addMonths(leftCurrentDate, 1))) {
          newDate = addMonths(leftCurrentDate, 1);
        }

        setRightCurrentDate(newDate);
        setRightView('days');
        setActiveSpecialView(null);
      }
    },
    [
      leftCurrentDate,
      rightCurrentDate,
      selectedStartDate,
      normalizedMinDate,
      normalizedMaxDate,
      isYearSelectable,
    ],
  );

  // Check if a date is in the selected range
  const isInSelectedRange = useCallback(
    (day: Date): boolean => {
      if (!selectedStartDate) return false;

      if (selectedEndDate) {
        const normalizedDay = startOfDay(day);
        const normalizedStart = startOfDay(selectedStartDate);
        const normalizedEnd = startOfDay(selectedEndDate);

        return (
          (isAfter(normalizedDay, normalizedStart) ||
            isSameDay(day, selectedStartDate)) &&
          (isBefore(normalizedDay, normalizedEnd) ||
            isSameDay(day, selectedEndDate))
        );
      }

      if (selectionPhase === 'end' && hoverDate) {
        if (isBefore(hoverDate, selectedStartDate)) {
          return isWithinInterval(day, {
            start: hoverDate,
            end: selectedStartDate,
          });
        } else {
          return isWithinInterval(day, {
            start: selectedStartDate,
            end: hoverDate,
          });
        }
      }

      return isSameDay(day, selectedStartDate);
    },
    [selectedStartDate, selectedEndDate, hoverDate, selectionPhase],
  );

  // Calendar rendering components
  const CalendarHeader = ({ side }: { side: 'left' | 'right' }) => {
    const isLeft = side === 'left';
    const currentDate = isLeft ? leftCurrentDate : rightCurrentDate;
    const view = isLeft ? leftView : rightView;
    const yearRange = isLeft ? leftYearRange : rightYearRange;

    let title;
    if (view === 'days') {
      title = format(currentDate, 'MMMM yyyy');
    } else if (view === 'months') {
      title = format(currentDate, 'yyyy');
    } else {
      title = `${yearRange.start}-${yearRange.end}`;
    }

    return (
      <Flex justifyContent='space-between' alignItems='center' mb={1}>
        {isLeft || activeSpecialView === 'right' ? (
          <IconButton
            aria-label='Previous'
            icon={<ChevronLeftOutline boxSize={18} color='navy' />}
            size='sm'
            variant='ghost'
            onClick={() => handleNavigation('prev')}
            isDisabled={
              isDisabled ||
              (view === 'months' && !canNavigate.prevYear) ||
              (view === 'years' && !canNavigate.prevYearRange) ||
              (view === 'days' && !canNavigate.prevMonth)
            }
          />
        ) : (
          <Box width='40px' />
        )}

        <Button
          variant='ghost'
          onClick={() => toggleView(side)}
          fontWeight='medium'
          isDisabled={isDisabled}
          rightIcon={<ChevronDownSolid />}
          color='navy'
        >
          {title}
        </Button>

        {!isLeft || activeSpecialView === 'left' ? (
          <IconButton
            aria-label='Next'
            icon={<ChevronRightOutline boxSize={18} color='navy' />}
            size='sm'
            variant='ghost'
            onClick={() => handleNavigation('next')}
            isDisabled={
              isDisabled ||
              (view === 'months' && !canNavigate.nextYear) ||
              (view === 'years' && !canNavigate.nextYearRange) ||
              (view === 'days' && !canNavigate.nextMonth)
            }
          />
        ) : (
          <Box width='40px' />
        )}
      </Flex>
    );
  };

  const DaysGrid = ({
    currentDate,
    isRightCalendar = false,
  }: {
    currentDate: Date;
    isRightCalendar?: boolean;
  }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const startDay = monthStart.getDay();
    const blanks = Array(startDay).fill(null);

    return (
      <Box>
        <Grid templateColumns='repeat(7, 1fr)' mb={1}>
          {dayNames.map(day => (
            <Text
              key={day}
              textAlign='center'
              fontSize='xs'
              fontWeight='medium'
              color={THEME.dayTextColor}
            >
              {day}
            </Text>
          ))}
        </Grid>

        {/* <Grid templateColumns='repeat(7, 1fr)' rowGap={2}> */}
        <Grid templateColumns='repeat(7, 1fr)' rowGap={2} columnGap={0}>
          {blanks.map((_, index) => (
            <Box key={`blank-${index}`}/>
          ))}

          {daysInMonth.map(day => {
            const isToday = isSameDay(day, new Date());
            const isStart = selectedStartDate
              ? isSameDay(day, selectedStartDate)
              : false;
            const isEnd = selectedEndDate
              ? isSameDay(day, selectedEndDate)
              : false;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isInRange = isDateInRange(day);
            const isDateDisabled = isDisabled || !isInRange;
            const isInSelected = isInSelectedRange(day);
            const isDisabledInRightCalendar =
              isRightCalendar &&
              selectionPhase === 'end' &&
              selectedStartDate &&
              isBefore(day, selectedStartDate);

            return (
              <Button
                key={day.toISOString()}
                size='xs'
                onClick={() => handleDateSelect(day)}
                onMouseEnter={() => handleDateHover(day)}
                onMouseLeave={() => setHoverDate(null)}
                display='flex'
                alignItems='center'
                justifyContent='center'
                bg={
                  isStart || isEnd
                    ? THEME.selectedBgColor
                    : isInSelected
                    ? THEME.inRangeBgColor
                    : 'transparent'
                }
                color={
                  isStart || isEnd
                    ? THEME.selectedTextColor
                    : isDateDisabled || isDisabledInRightCalendar
                    ? THEME.disabledTextColor
                    : THEME.dayTextColor
                }
                border={
                  isToday && !isStart && !isEnd
                    ? '1px solid'
                    : '1px solid transparent'
                }
                borderColor={
                  isToday && !isStart && !isEnd
                    ? THEME.todayBorderColor
                    : 'transparent'
                }
                borderTopLeftRadius={isStart ? '10px' : ''}
                borderBottomLeftRadius={isStart ? '10px' : ''}
                borderTopRightRadius={isEnd ? '10px' : ''}
                borderBottomRightRadius={isEnd ? '10px' : ''}
                opacity={isCurrentMonth ? 1 : 0.5}
                _hover={
                  !isDateDisabled && !isDisabledInRightCalendar
                    ? isInSelected
                      ? {}
                      : { bg: THEME.hoverColor }
                    : {}
                }
                isDisabled={!!(isDateDisabled || isDisabledInRightCalendar)}
                cursor={
                  isDateDisabled || isDisabledInRightCalendar
                    ? 'not-allowed'
                    : 'pointer'
                }
              >
                {format(day, 'd')}
              </Button>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const MonthsGrid = ({ side }: { side: 'left' | 'right' }) => {
    const isLeft = side === 'left';
    const currentDate = isLeft ? leftCurrentDate : rightCurrentDate;
    const months = [
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
    const currentMonth = currentDate.getMonth();
    const currentYear = getYear(currentDate);
    const leftYear = getYear(leftCurrentDate);
    const leftMonth = leftCurrentDate.getMonth();

    return (
      <Box width='100%'>
        <Grid templateColumns='repeat(3, 1fr)' gap={2}>
          {months.map((month, index) => {
            const isCurrentMonth =
              currentMonth === index && getYear(new Date()) === currentYear;
            const monthDate = new Date(currentYear, index, 1);
            const isMonthDisabled = isDisabled || !isDateInRange(monthDate);
            const isBeforeLeftCalendar =
              !isLeft &&
              ((currentYear === leftYear && index <= leftMonth) ||
                currentYear < leftYear);

            return (
              <Button
                key={month}
                size='sm'
                variant='unstyled'
                onClick={() => handleMonthSelect(side, index)}
                display='flex'
                alignItems='center'
                justifyContent='center'
                borderRadius='md'
                p={2}
                bg={isCurrentMonth ? THEME.selectedBgColor : 'transparent'}
                color={
                  isCurrentMonth
                    ? THEME.selectedTextColor
                    : isMonthDisabled || isBeforeLeftCalendar
                    ? THEME.disabledTextColor
                    : THEME.dayTextColor
                }
                _hover={
                  !isCurrentMonth && !isMonthDisabled && !isBeforeLeftCalendar
                    ? { bg: THEME.hoverColor }
                    : {}
                }
                height='36px'
                isDisabled={isMonthDisabled || isBeforeLeftCalendar}
                cursor={
                  isMonthDisabled || isBeforeLeftCalendar
                    ? 'not-allowed'
                    : 'pointer'
                }
              >
                {month}
              </Button>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const YearsGrid = ({ side }: { side: 'left' | 'right' }) => {
    const isLeft = side === 'left';
    const currentDate = isLeft ? leftCurrentDate : rightCurrentDate;
    const yearRange = isLeft ? leftYearRange : rightYearRange;
    const years = Array.from({ length: 12 }, (_, i) => yearRange.start + i);
    const currentYear = getYear(currentDate);
    const leftYear = getYear(leftCurrentDate);

    return (
      <Box>
        <Grid templateColumns='repeat(3, 1fr)' gap={2}>
          {years.map(year => {
            const isCurrentYear = currentYear === year;
            const isYearDisabled = isDisabled || !isYearSelectable(year);
            const isBeforeLeftYear = !isLeft && year < leftYear;

            return (
              <Button
                key={year}
                size='sm'
                variant='unstyled'
                onClick={() => handleYearSelect(side, year)}
                display='flex'
                alignItems='center'
                justifyContent='center'
                borderRadius='md'
                p={2}
                bg={isCurrentYear ? THEME.selectedBgColor : 'transparent'}
                color={
                  isCurrentYear
                    ? THEME.selectedTextColor
                    : isYearDisabled || isBeforeLeftYear
                    ? THEME.disabledTextColor
                    : THEME.dayTextColor
                }
                _hover={
                  !isCurrentYear && !isYearDisabled && !isBeforeLeftYear
                    ? { bg: THEME.hoverColor }
                    : {}
                }
                height='36px'
                isDisabled={isYearDisabled || isBeforeLeftYear}
                cursor={
                  isYearDisabled || isBeforeLeftYear ? 'not-allowed' : 'pointer'
                }
              >
                {year}
              </Button>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // Render calendar content based on view
  const renderCalendarContent = (side: 'left' | 'right') => {
    const isLeft = side === 'left';
    const view = isLeft ? leftView : rightView;
    const currentDate = isLeft ? leftCurrentDate : rightCurrentDate;

    if (view === 'days') {
      return <DaysGrid currentDate={currentDate} isRightCalendar={!isLeft} />;
    } else if (view === 'months') {
      return <MonthsGrid side={side} />;
    } else {
      return <YearsGrid side={side} />;
    }
  };

  return (
    <Flex>
      {activeSpecialView ? (
        // Show only one calendar's special view
        <Box flex={1}>
          <CalendarHeader side={activeSpecialView} />
          {renderCalendarContent(activeSpecialView)}
        </Box>
      ) : (
        // Show both calendars in normal view
        <>
          {/* Left Calendar */}
          <Box flex={1} borderRight='1px solid' borderColor='gray.200' pt={4}>
            <CalendarHeader side='left' />
            {renderCalendarContent('left')}
          </Box>

          {/* Right Calendar */}
          <Box flex={1} pt={4}>
            <CalendarHeader side='right' />
            {renderCalendarContent('right')}
          </Box>
        </>
      )}
    </Flex>
  );
};
