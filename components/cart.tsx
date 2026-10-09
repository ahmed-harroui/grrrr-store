'use client'

import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { checkout } from '@/lib/account'
import { Croquettes } from '@/components/croquettes'

export interface CartLine {
  slug: string
  name: string
  variant: string
  image: string
  /** Price of one, in croquettes */
  croquettes: number
  quantity: number
}

const field = 'w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary'

interface CartProps {
  lines: CartLine[]
  onChange: (lines: CartLine[]) => void
  session: Session | null
  balance: number | null
  onPaid: (balance: number) => void
  onSignIn: () => void
  onWallet: () => void
  onClose: () => void
}

/** The basket, then the order: delivery address, paid in croquettes. */
export function Cart({ lines, onChange, session, balance, onPaid, onSignIn, onWallet, onClose }: CartProps) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ total: number } | null>(null)

  const total = lines.reduce((sum, line) => sum + line.croquettes * line.quantity, 0)
  const missing = balance == null ? 0 : Math.max(0, total - balance)

  const setQuantity = (index: number, quantity: number) => {
    onChange(quantity < 1 ? lines.filter((_, i) => i !== index) : lines.map((line, i) => (i === index ? { ...line, quantity: Math.min(quantity, 10) } : line)))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const shipping = Object.fromEntries(new FormData(event.currentTarget))
    setError('')
    setBusy(true)
    try {
      const paid = await checkout<{ total: number; balance: number }>({ action: 'order', shipping, items: lines.map(({ slug, variant, quantity }) => ({ slug, variant, quantity })) }, session)
      onPaid(paid.balance)
      onChange([])
      setDone({ total: paid.total })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/30 backdrop-blur-sm" onClick={onClose}>
      <aside className="ml-auto flex h-full w-[min(94%,440px)] flex-col overflow-y-auto bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="text-2xl font-black">Ton panier</h2><button onClick={onClose} aria-label="Fermer le panier"><X /></button></div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-mint text-4xl">🎉</div>
            <p className="text-lg font-black">Commande confirmée</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Tu as payé <Croquettes amount={done.total} className="text-foreground" />. On prépare ton colis et on te tient au courant par e-mail.</p>
            <button onClick={onClose} className="mt-7 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Continuer mes découvertes</button>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-soft-pink"><ShoppingBag className="text-primary" size={34} /></div>
            <p className="text-lg font-black">Ton panier est encore vide</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Les articles choisis apparaîtront ici. Tout se paie en croquettes.</p>
            <button onClick={onClose} className="mt-7 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Continuer mes découvertes</button>
          </div>
        ) : (
          <>
            <ul className="mt-6 grid gap-3">
              {lines.map((line, index) => (
                <li key={`${line.slug}-${line.variant}`} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <img src={line.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{line.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{line.variant}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-black">
                        <button onClick={() => setQuantity(index, line.quantity - 1)} aria-label={`Retirer un ${line.name}`} className="flex h-7 w-7 items-center justify-center rounded-full border border-border"><Minus size={14} /></button>
                        {line.quantity}
                        <button onClick={() => setQuantity(index, line.quantity + 1)} aria-label={`Ajouter un ${line.name}`} className="flex h-7 w-7 items-center justify-center rounded-full border border-border"><Plus size={14} /></button>
                      </span>
                      <Croquettes amount={line.croquettes * line.quantity} className="text-primary" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-lg font-black"><span>Total</span><Croquettes amount={total} className="text-primary" /></div>
            {session && balance != null && <p className="mt-1 flex items-center justify-between text-sm text-muted-foreground"><span>Tes croquettes</span><Croquettes amount={balance} /></p>}

            {!session ? (
              <button onClick={onSignIn} className="mt-6 w-full rounded-full bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20">Me connecter pour commander</button>
            ) : missing > 0 ? (
              <div className="mt-6 rounded-3xl bg-soft-pink p-5 text-center">
                <p className="font-black">Il te manque <Croquettes amount={missing} className="text-primary" /></p>
                <button onClick={onWallet} className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-black text-primary-foreground">Obtenir des croquettes</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-3">
                <p className="text-sm font-black">Adresse de livraison</p>
                <input name="name" required maxLength={100} autoComplete="name" placeholder="Nom et prénom" aria-label="Nom et prénom" className={field} />
                <input name="address" required maxLength={200} autoComplete="street-address" placeholder="Numéro et rue" aria-label="Numéro et rue" className={field} />
                <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                  <input name="postcode" required maxLength={12} autoComplete="postal-code" placeholder="Code postal" aria-label="Code postal" className={field} />
                  <input name="city" required maxLength={80} autoComplete="address-level2" placeholder="Ville" aria-label="Ville" className={field} />
                </div>
                <input name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="Téléphone (pour le livreur)" aria-label="Téléphone" className={field} />
                {error && <p role="alert" className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-primary">{error}</p>}
                <button type="submit" disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60">{busy ? 'Un instant…' : <>Payer <Croquettes amount={total} /></>}</button>
              </form>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
