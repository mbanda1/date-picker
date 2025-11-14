import { forwardRef } from 'react';
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
} from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { DatePickerInput } from './DatePickerInput';
import { DatePickerInputHookForm7Props } from '../types';

export const DatePickerInputHookForm7 = forwardRef<
  HTMLDivElement,
  DatePickerInputHookForm7Props<any>
>(
  (
    {
      name,
      control,
      label,
      helperText,
      error,
      showError = true,
      rules,
      isRequired,
      ...rest
    },
    ref,
  ) => {
    return (
      <FormControl isInvalid={!!error} isRequired={isRequired} ref={ref}>
        {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field: { onChange, value } }) => (
            <DatePickerInput
              {...rest}
              value={value}
              onChange={onChange}
              isRequired={isRequired}
              isInvalid={!!error}
              clearInput={() => onChange(null)}
              placeholder={rest.placeholder ?? 'dd/mm/yyyy'}
            />
          )}
        />
        {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
        {showError && error && (
          <FormErrorMessage>{error.message}</FormErrorMessage>
        )}
      </FormControl>
    );
  },
);

DatePickerInputHookForm7.displayName = 'DatePickerInputHookForm7';
