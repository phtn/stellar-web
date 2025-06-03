'use server'

import { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const opts: CookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: true,
  secure: true
}

export const setWSState = async (state: 'enabled' | 'disabled') => {
  const store = await cookies()
  store.set('ws-state', state, { ...opts })
}

export const getWSState = async () => {
  const store = await cookies()
  return store.get('ws-state')?.value
}
