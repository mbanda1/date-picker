export interface PickerLabels {
  dialog: string;
  openCalendar: string;
  clear: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  previousYears: string;
  nextYears: string;
  chooseMonth: string;
  chooseYear: string;
  backToCalendar: string;
  today: string;
  time: string;
  presets: string;
  apply: string;
  cancel: string;
}

export const DEFAULT_LABELS: PickerLabels = {
  dialog: 'Choose date',
  openCalendar: 'Open calendar',
  clear: 'Clear',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  backToCalendar: 'Back to calendar',
  today: 'Today',
  time: 'Time',
  presets: 'Presets',
  apply: 'Apply',
  cancel: 'Cancel',
};
