import type React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
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
  size = 'md',
  variant = 'outline',
  showClearIcon = true,
  ...rest
}: DatePickerInputProps) => {
  // Input value and picker visibility
  const [inputValue, setInputValue] = useState<string>(
    value && isValid(value) ? format(value, dateFormat) : '',
  );
  const [isOpen, setIsOpen] = useState(false);

  // Refs for positioning and outside click detection
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
    <Box position='relative' width='100%'>
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
              <Box
                onClick={() => {
                  onChange?.(null);
                  clearInput?.();
                  setInputValue('');
                }}
                cursor='pointer'
              >
                <XCircleOutline
                  boxSize={4}
                  color='gray.500'
                  aria-label='Clear date'
                />
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
        <Box
          ref={popoverRef}
          position='absolute'
          zIndex={10}
          top='calc(100% + 8px)'
          left='0'
          width='100%'
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
