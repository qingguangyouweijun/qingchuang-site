'use server'

import { redirect } from 'next/navigation'

export default async function CampusWalletRedirectPage() {
  redirect('/profile/wallet')
}
