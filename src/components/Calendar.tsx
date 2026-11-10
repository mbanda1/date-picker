import type { CalendarApi, CalendarPanel } from '../hooks/useCalendar';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface HeaderProps {
  calendar: CalendarApi;
  title: string;
  titleId?: string;
  panelIndex?: number;
  showPrev: boolean;
  showNext: boolean;
}

const CalendarHeader = ({ calendar, title, titleId, panelIndex, showPrev, showNext }: HeaderProps) => (
  <div className='dp-header'>
    {showPrev ? (
      <button className='dp-nav dp-nav-prev' {...calendar.getPrevButtonProps()}>
        <ChevronLeftIcon />
      </button>
    ) : (
      <span className='dp-nav-spacer' />
    )}
    <button className='dp-title' {...calendar.getTitleButtonProps(panelIndex)}>
      <span id={titleId} aria-live='polite'>
        {title}
      </span>
      <ChevronDownIcon />
    </button>
    {showNext ? (
      <button className='dp-nav dp-nav-next' {...calendar.getNextButtonProps()}>
        <ChevronRightIcon />
      </button>
    ) : (
      <span className='dp-nav-spacer' />
    )}
  </div>
);

const DaysPanel = ({ calendar, panel, count }: { calendar: CalendarApi; panel: CalendarPanel; count: number }) => (
  <div className='dp-panel'>
    <CalendarHeader
      calendar={calendar}
      title={panel.title}
      titleId={panel.titleId}
      panelIndex={panel.index}
      showPrev={panel.index === 0}
      showNext={panel.index === count - 1}
    />
    <div className='dp-grid' {...calendar.getGridProps(panel.index)}>
      <div className='dp-row dp-weekdays' role='row'>
        {calendar.weekdays.map(day => (
          <div key={day.long} className='dp-weekday' role='columnheader' aria-label={day.long}>
            <span aria-hidden='true'>{day.short}</span>
          </div>
        ))}
      </div>
      {panel.weeks.map(week => (
        <div key={week[0].date.getTime()} className='dp-row' role='row'>
          {week.map(cell => (
            <div key={cell.date.getTime()} className='dp-cell' {...calendar.getDayCellProps(cell)}>
              {!cell.isOutsideMonth && (
                <button className='dp-day' {...calendar.getDayProps(cell)}>
                  {cell.label}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/** Days, months or years view for a picker, driven entirely by the calendar API. */
export const Calendar = ({ calendar }: { calendar: CalendarApi }) => {
  if (calendar.view === 'days') {
    return (
      <div className='dp-calendar' data-view='days'>
        {calendar.panels.map(panel => (
          <DaysPanel key={panel.index} calendar={calendar} panel={panel} count={calendar.panels.length} />
        ))}
      </div>
    );
  }

  const cells =
    calendar.view === 'months'
      ? calendar.months.map(cell => (
          <button key={cell.month} className='dp-view-cell' {...calendar.getMonthProps(cell)}>
            {cell.label}
          </button>
        ))
      : calendar.years.map(cell => (
          <button key={cell.year} className='dp-view-cell' {...calendar.getYearProps(cell)}>
            {cell.label}
          </button>
        ));

  return (
    <div className='dp-calendar' data-view={calendar.view}>
      <div className='dp-panel'>
        <CalendarHeader calendar={calendar} title={calendar.viewTitle} showPrev showNext />
        <div className='dp-view-grid'>{cells}</div>
      </div>
    </div>
  );
};
