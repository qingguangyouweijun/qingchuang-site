'use server'

import { redirect } from 'next/navigation'

export default async function CampusOrdersRedirectPage() {
  redirect('/profile/orders')
}
