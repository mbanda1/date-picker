import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@mbanda1/date-picker/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Date picker playground',
  description: 'Examples for @mbanda1/date-picker in the Next.js App Router',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
