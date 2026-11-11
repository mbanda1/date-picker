import { DatePicker } from '@mbanda1/date-picker';
import { saveBooking } from './actions';
import {
  ControlledSingle,
  CustomTheme,
  HookFormExample,
  LocalisedPickers,
  RangeExamples,
  ThemeToggle,
} from './client-examples';
import { HeadlessPicker } from './headless-picker';

export default async function Page({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;

  return (
    <main>
      <header className='page-header'>
        <div>
          <h1>@mbanda1/date-picker</h1>
          <p className='muted'>Playground and smoke test for the Next.js App Router.</p>
        </div>
        <ThemeToggle />
      </header>

      <ControlledSingle />
      <RangeExamples />
      <HookFormExample />

      <section>
        <h2>Server Component and Server Action</h2>
        <p className='muted'>
          This picker is rendered by a Server Component without any client-side wrapper. Its <code>name</code> prop
          adds a hidden input, so the form posts an ISO date to a Server Action.
        </p>
        <form action={saveBooking} className='stack'>
          <label htmlFor='booking'>Booking date</label>
          <DatePicker id='booking' name='booking' placeholder='Pick a day' />
          <button type='submit' className='button'>
            Save booking
          </button>
        </form>
        {saved && (
          <p role='status'>
            Server received <code>{saved}</code>
          </p>
        )}
      </section>

      <LocalisedPickers />
      <CustomTheme />
      <HeadlessPicker />
    </main>
  );
}
