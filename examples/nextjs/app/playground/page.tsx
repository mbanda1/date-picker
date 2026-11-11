import type { Metadata } from 'next';
import { ThemeToggle } from '../client-examples';
import { Playground } from './playground';

export const metadata: Metadata = {
  title: 'Props playground',
  description: 'Change @mbanda1/date-picker props and see the result live',
};

export default function PlaygroundPage() {
  return (
    <main className='pg-main'>
      <header className='page-header'>
        <div>
          <h1>Props playground</h1>
          <p className='muted'>
            Change props on the left and try the picker on the right. <a href='/'>Back to examples</a>
          </p>
        </div>
        <ThemeToggle />
      </header>
      <Playground />
    </main>
  );
}
