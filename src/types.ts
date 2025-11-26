export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
  isDisabled?: boolean;
  showTodayButton?: boolean;
  placeholder?: string;
  showTimeSelect?: boolean;
  timeInterval?: number;
  minTime?: string; // Format: "HH:mm"
  maxTime?: string; // Format: "HH:mm"
}

export interface DatePickerInputProps extends DatePickerProps {
  placeholder?: string;
  dateFormat?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  showClearIcon?: boolean;
  clearInput?: () => void;
  onInputChange?: (value: string) => void;
}

export interface DateRangePickerInputProps extends DateRangePickerProps {
  placeholder?: string;
  dateFormat?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  showClearIcon?: boolean;
  onInputChange?: (value: string) => void;
  clearInput?: () => void;
  showPresets?: boolean;
  isLoading?: boolean;
}

export interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onChange?: (dates: { startDate: Date | null; endDate: Date | null }) => void;
  defaultStartDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  isDisabled?: boolean;
}

export interface TimeOverlayProps {
  time?: Date | null;
  onChange?: (time: Date | null) => void;
  defaultTime?: Date;
  timeFormat?: '12h' | '24h';
  isDisabled?: boolean;
  interval?: number; // Time interval in minutes
  startTime?: Date; // Start time of the day
  endTime?: Date; // End time of the day
}

export interface TimeSelectorInputProps {
  time?: Date | null;
  onChange?: (time: Date | null) => void;
  clearInput?: () => void;
  defaultTime?: Date;
  timeFormat?: '12h' | '24h';
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  interval?: number; // Time interval in minutes
  startTime?: Date; // Start time of the day
  endTime?: Date; // End time of the day
}