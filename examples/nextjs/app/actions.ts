'use server';

import { redirect } from 'next/navigation';

export async function saveBooking(formData: FormData) {
  const booking = String(formData.get('booking') ?? '');
  redirect(booking ? `/?saved=${encodeURIComponent(booking)}` : '/');
}
