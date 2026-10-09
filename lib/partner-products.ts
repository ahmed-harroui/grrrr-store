// Products added by GRRR Care partners. They live in the ecosystem's Supabase project and are only reached
// through its store-products Edge Function, which checks who may see or change what.
const ENDPOINT = 'https://mfamxvbepohyeigpnsyi.supabase.co/functions/v1/store-products'

export const PRODUCT_CATEGORIES = [
  { key: 'accessories', label: 'Accessoires' },
  { key: 'toys', label: 'Jouets' },
  { key: 'food', label: 'Alimentation' },
  { key: 'care', label: 'Soins' },
  { key: 'services', label: 'Services' },
  { key: 'other', label: 'Autre' },
] as const

export interface Partner {
  name: string
  city: string | null
  address: string | null
  phone: string | null
  website: string | null
  /** Offered to GRRR members, in percent */
  discount: number | null
}

export interface PartnerProduct {
  id: string
  name: string
  description: string | null
  /** Already formatted, e.g. "24,90 €" */
  price: string
  category: string
  image: string | null
  url: string | null
  status: 'pending' | 'published' | 'rejected'
  partner?: Partner
}

export async function storeProducts<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Une erreur est survenue. Réessayez dans un instant.')
  return data
}
