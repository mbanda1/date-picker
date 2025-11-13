import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Portal,
  Text,
  useOutsideClick,
  VStack,
} from '@chakra-ui/react';
import { format, isValid } from 'date-fns';
import { DateRangeOverlay } from './DateRangeOverlay';
import { CalendarOutline, XCircleOutline } from '../components/icons';
import DateRangePresets from './DateRangePresets';
import { DateRangePickerInputProps } from '../types';

export const DateRangePickerInput = ({
  startDate,
  endDate,
  onChange,
  defaultStartDate,
  minDate,
  maxDate,
  placeholder = 'Select date range...',
  dateFormat = 'yyyy MMM d',
  isDisabled = false,
  isRequired = false,
  isInvalid = false,
  size = 'md',
  variant = 'outline',
  showClearIcon = true,
  clearInput,
  showPresets,
  isLoading,
  ...rest
}: DateRangePickerInputProps) => {
  // Input value and picker visibility
  const [inputValue, setInputValue] = useState<string>(() => {
    if (startDate && isValid(startDate)) {
      if (endDate && isValid(endDate)) {
        return `${format(startDate, dateFormat)} - ${format(
          endDate,
          dateFormat,
        )}`;
      }
      return format(startDate, dateFormat);
    }
    return '';
  });

  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date | null>(
    startDate || null,
  );
  const [localEndDate, setLocalEndDate] = useState<Date | null>(
    endDate || null,
  );

  // Refs for positioning and outside click detection
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Close the date picker when clicking outside
  useOutsideClick({
    ref: popoverRef as React.RefObject<HTMLElement>,
    handler: (e: Event) => {
      if (inputRef.current && inputRef.current.contains(e.target as Node)) {
        return;
      }
      // If only start date is selected, revert to last committed (props) values
      if (localStartDate && !localEndDate) {
        setLocalStartDate(startDate || null);
        setLocalEndDate(endDate || null);
      }
      setIsOpen(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setLocalStartDate(startDate || null);
      setLocalEndDate(endDate || null);
    }
  }, [isOpen]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const recalc = () => {
      const rect = inputRef.current!.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [isOpen]);

  useEffect(() => {
    if (startDate && isValid(startDate)) {
      if (endDate && isValid(endDate)) {
        setInputValue(
          `${format(startDate, dateFormat)} - ${format(endDate, dateFormat)}`,
        );
      } else {
        setInputValue(format(startDate, dateFormat));
      }
    } else if (startDate === null && endDate === null) {
      setInputValue('');
    }
  }, [startDate, endDate, dateFormat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter key
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(false);
      }

      // Handle Escape key
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [],
  );

  const handleDateChange = useCallback(
    (dates: { startDate: Date | null; endDate: Date | null }) => {
      setLocalStartDate(dates.startDate);
      setLocalEndDate(dates.endDate);
    },
    [],
  );

  const togglePicker = useCallback(() => {
    if (!isDisabled) {
      if (!isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setPopoverPosition({
          top: rect.bottom + 8, // 8px offset below the input
          left: rect.left,
          width: rect.width,
        });
      }
      setIsOpen(prev => !prev);
    }
  }, [isDisabled, isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return;
    return format(date, 'yyyy MMM d');
  };

  const handleApply = useCallback(() => {
    onChange?.({ startDate: localStartDate, endDate: localEndDate });
    if (localStartDate && isValid(localStartDate)) {
      if (localEndDate && isValid(localEndDate)) {
        setInputValue(
          `${format(localStartDate, dateFormat)} - ${format(
            localEndDate,
            dateFormat,
          )}`,
        );
      } else {
        setInputValue(format(localStartDate, dateFormat));
      }
    } else {
      setInputValue('');
    }
    setIsOpen(false);
  }, [onChange, localStartDate, localEndDate, dateFormat]);

  const handleCancel = useCallback(() => {
    if (localStartDate && !localEndDate) {
      setLocalStartDate(startDate || null);
      setLocalEndDate(endDate || null);
    }
    setIsOpen(false);
  }, [localStartDate, localEndDate, startDate, endDate]);

  const handleClear = useCallback(() => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    onChange?.({ startDate: null, endDate: null });
    setInputValue('');
    clearInput?.();
  }, [onChange, clearInput]);

  return (
    <Box>
      <InputGroup>
        <Input
          ref={inputRef}
          value={inputValue}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onClick={togglePicker}
          isDisabled={isDisabled}
          isRequired={isRequired}
          isInvalid={isInvalid}
          size={size}
          variant={variant}
          autoComplete='off'
          isReadOnly
        />

        <InputRightElement width='4rem'>
          <HStack justify='space-between' w='100%'>
            {inputValue && !isDisabled && showClearIcon && (
              <Box onClick={handleClear} cursor='pointer'>
                <XCircleOutline boxSize={4} color='gray.500' />
              </Box>
            )}
            <Box
              onClick={togglePicker}
              cursor={isDisabled ? 'not-allowed' : 'pointer'}
            >
              <CalendarOutline
                boxSize={4}
                opacity={isDisabled ? 0.4 : 1}
                color='green'
              />
            </Box>
          </HStack>
        </InputRightElement>
      </InputGroup>

      {isOpen && (
        <Portal>
          <Box
            ref={popoverRef}
            position='fixed'
            zIndex={1000}
            top={`${popoverPosition.top}px`}
            left={`${popoverPosition.left}px`}
            bg='white'
            borderRadius='lg'
            boxShadow='lg'
          >
            {/* start */}
            <HStack>
              {showPresets && (
                <Box w='105px' h='100%' pl={1}>
                  <DateRangePresets onSelectRange={handleDateChange} />
                </Box>
              )}

              <VStack
                h='100%'
              >
                  <DateRangeOverlay
                    {...rest}
                    startDate={localStartDate}
                    endDate={localEndDate}
                    onChange={handleDateChange}
                    defaultStartDate={defaultStartDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    isDisabled={isDisabled}
                  />

                <HStack
                  justify='space-between'
                  w='100%'
                  position='sticky'
                  bottom={0}
                  bg='white'
                  borderTop='1px solid'
                  borderColor='gray.200'
                  px={4}
                  py={3}
                  borderBottomLeftRadius='lg'
                  borderBottomRightRadius='lg'
                >
                  <Text
                    layerStyle='text-regular'
                    color='charcoal'
                    whiteSpace={'nowrap'}
                  >
                    {localStartDate && localEndDate
                      ? `${formatDate(localStartDate)} - ${formatDate(
                          localEndDate,
                        )}`
                      : localStartDate
                      ? formatDate(localStartDate)
                      : ''}
                  </Text>
                  <HStack align='center' spacing={6}>
                    <Button
                      variant='ghost'
                      layerStyle='outline-btn'
                      textTransform='none'
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='solid'
                      layerStyle='solid-btn'
                      type='button'
                      onClick={handleApply}
                      isDisabled={!localStartDate || !localEndDate || isLoading}
                    >
                      Apply
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
            </HStack>

            {/* end */}
          </Box>
        </Portal>
      )}
    </Box>
  );
};
