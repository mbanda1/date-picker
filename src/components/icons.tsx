import type { SVGProps } from 'react';

const Svg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox='0 0 24 24'
    width='1em'
    height='1em'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
    {...props}
  />
);

export const CalendarIcon = () => (
  <Svg>
    <rect x='3' y='4.5' width='18' height='16.5' rx='2' />
    <path d='M3 9.5h18M8 2.5v4M16 2.5v4' />
  </Svg>
);

export const ClearIcon = () => (
  <Svg>
    <path d='M6 6l12 12M18 6L6 18' />
  </Svg>
);

export const ChevronLeftIcon = () => (
  <Svg>
    <path d='M15 18l-6-6 6-6' />
  </Svg>
);

export const ChevronRightIcon = () => (
  <Svg>
    <path d='M9 18l6-6-6-6' />
  </Svg>
);

export const ChevronDownIcon = () => (
  <Svg>
    <path d='M6 9l6 6 6-6' />
  </Svg>
);
