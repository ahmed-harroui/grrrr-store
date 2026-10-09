'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'

// The store shares the accounts of the GRRRR apps (same Supabase project), and is paid in croquettes:
// the treats the account's pets earn in the apps, which can also be bought. 1 croquette is worth 0,50 €.
const SUPABASE_URL = 'https://mfamxvbepohyeigpnsyi.supabase.co'
// Publishable key: meant to be in the browser, the database's rules decide what it may read
const SUPABASE_KEY = 'sb_publishable_5G4dWlVi6QbcC38UH-qOkg_L-6Xl1B1'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export interface Pack {
  key: string
  croquettes: number
  /** Already formatted, e.g. "25 €" */
  price: string
  label: string
}

/** Orders and croquettes go through the store-checkout Edge Function, with the account's session when signed in. */
export async function checkout<T = { ok: true }>(body: Record<string, unknown>, session?: Session | null): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/store-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Une erreur est survenue. Réessaie dans un instant.'), { code: data.code })
  return data
}

/** The signed-in account and its croquettes (null while unknown or signed out). */
export function useAccount() {
  const [session, setSession] = useState<Session | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const refresh = useCallback(async () => {
    if (!userId) return setBalance(null)
    const { data, error } = await supabase.rpc('my_croquettes')
    setBalance(error || typeof data !== 'number' ? null : data)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  return { session, balance, setBalance, refresh }
}
