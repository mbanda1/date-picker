import type React from 'react';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  Box,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  useOutsideClick,
} from '@chakra-ui/react';
import { format, isValid, parse } from 'date-fns';
import { DateOverlay } from './DateOverlay';
import { CalendarOutline, XCircleOutline } from '../components/icons';
import { DatePickerInputProps } from '../types';

const getRightElementWidth = (
  size: DatePickerInputProps['size'],
  hasClear: boolean,
): string => {
  if (size === 'sm') {
    return hasClear ? '3.5rem' : '2.5rem';
  }
  if (size === 'lg') {
    return hasClear ? '4.5rem' : '3.5rem';
  }
  return hasClear ? '4rem' : '3rem';
};

export const DatePickerInput = ({
  value,
  onChange,
  clearInput,
  defaultValue,
  minDate,
  maxDate,
  placeholder = 'Select date',
  dateFormat = 'yyyy-MM-dd',
  isDisabled = false,
  isRequired = false,
  isInvalid = false,
  size: sizeProp = 'md',
  variant = 'outline',
  showClearIcon = true,
  ...rest
}: DatePickerInputProps) => {
  const size = sizeProp ?? 'md';
  // Input value and picker visibility
  const [inputValue, setInputValue] = useState<string>(
    value && isValid(value) ? format(value, dateFormat) : '',
  );
  const [isOpen, setIsOpen] = useState(false);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const shouldShowClear = Boolean(inputValue && !isDisabled && showClearIcon);
  const iconBoxSize = size === 'sm' ? 3 : 4;
  const iconSpacing = size === 'sm' ? 1 : 2;
  const iconWrapperWidth = size === 'sm' ? '1.5rem' : '2rem';
  const overlayWidthValue = overlayWidth === null ? '100%' : `${overlayWidth}px`;
  const rightElementWidth = getRightElementWidth(size, shouldShowClear);
  // Refs for positioning and outside click detection
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) {
      return;
    }

    const updateWidth = () => {
      setOverlayWidth(inputEl.offsetWidth);
    };

    updateWidth();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(inputEl);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateWidth);
    }

    return () => {
      resizeObserver?.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateWidth);
      }
    };
  }, [size]);

  // Close the date picker when clicking outside
  useOutsideClick({
    ref: popoverRef,
    handler: e => {
      if (inputRef.current && inputRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    },
  });

  // Update input value when value prop changes
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, dateFormat));
    } else if (value === null) {
      setInputValue('');
    }
  }, [value, dateFormat]);

  // Handle key down events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle Enter key
      if (e.key === 'Enter') {
        e.preventDefault();

        // Try to parse current input
        if (inputValue) {
          const parsedDate = parse(inputValue, dateFormat, new Date());
          const inRange =
            (!minDate || parsedDate >= minDate) &&
            (!maxDate || parsedDate <= maxDate);
          if (isValid(parsedDate) && inRange) {
            onChange?.(parsedDate);
            setIsOpen(false);
          } else {
            setInputValue(
              value && isValid(value) ? format(value, dateFormat) : '',
            );
          }
        }
      }

      // Handle Escape key
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [inputValue, dateFormat, onChange, value],
  );

  // Handle date selection from the picker
  const handleDateChange = useCallback(
    (date: Date | null) => {
      onChange?.(date);
      if (date && isValid(date)) {
        setInputValue(format(date, dateFormat));
      } else {
        setInputValue('');
      }
      setIsOpen(false);
    },
    [onChange, dateFormat],
  );

  // Toggle the date picker
  const togglePicker = useCallback(() => {
    if (!isDisabled) {
      setIsOpen(prev => !prev);
    }
  }, [isDisabled]);

  return (
    <Box position='relative'>
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

        <InputRightElement width={rightElementWidth}>
          <HStack justify='flex-end' spacing={iconSpacing} align='center'>
            {shouldShowClear && (
              <Box
                width={iconWrapperWidth}
                onClick={() => {
                  onChange?.(null);
                  clearInput?.();
                  setInputValue('');
                }}
                cursor='pointer'
                display='flex'
                alignItems='center'
                justifyContent='center'
              >
                <XCircleOutline
                  boxSize={iconBoxSize}
                  color='gray.500'
                  aria-label='Clear date'
                />
              </Box>
            )}
            <Box
              width={iconWrapperWidth}
              onClick={togglePicker}
              cursor={isDisabled ? 'not-allowed' : 'pointer'}
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <CalendarOutline
                boxSize={iconBoxSize}
                opacity={isDisabled ? 0.4 : 1}
                color='green'
              />
            </Box>
          </HStack>
        </InputRightElement>
      </InputGroup>

      {isOpen && (
        <Box
          ref={popoverRef}
          position='absolute'
          zIndex={1000}
          top='calc(100% + 8px)'
          left='0'
          width={overlayWidthValue}
        >
          <DateOverlay
            value={value}
            onChange={handleDateChange}
            defaultValue={defaultValue}
            minDate={minDate}
            maxDate={maxDate}
            isDisabled={isDisabled}
            {...rest}
          />
        </Box>
      )}
    </Box>
  );
};
