'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { X } from 'lucide-react'
import { checkout, supabase, type Pack } from '@/lib/account'

/** A price or a balance in croquettes: the kibble of the GRRRR logo, then the number. */
export function Croquettes({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-black ${className}`}>
      <img src="/croquette.png" alt="" className="h-[1.15em] w-auto" />
      {amount}
      <span className="sr-only"> croquettes</span>
    </span>
  )
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-charcoal/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-background p-6 shadow-2xl sm:rounded-[2rem] sm:p-8" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-black tracking-[-0.04em]">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-full p-1 hover:bg-secondary"><X /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

const field = 'w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary'
const label = 'mb-1.5 block text-sm font-black'

/** Sign in or create the account shared with the GRRRR and GRRR Care apps. */
export function AccountDialog({ onClose }: { onClose: () => void }) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    setError('')
    setBusy(true)
    try {
      if (creating) {
        const { data, error } = await supabase.auth.signUp({ email: fields.email.trim(), password: fields.password, options: { data: { name: fields.name.trim() } } })
        if (error) throw error
        // No session back: the email has an account already, or must be confirmed first
        if (!data.session) return setNotice(data.user?.identities?.length === 0 ? 'Cet e-mail a déjà un compte GRRRR : connecte-toi plutôt.' : 'Compte créé ! Ouvre le lien reçu par e-mail, puis connecte-toi ici.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: fields.email.trim(), password: fields.password })
        if (error) throw error
      }
      onClose()
    } catch (e) {
      const message = (e as Error).message
      setError(/invalid login|invalid credentials/i.test(message) ? 'E-mail ou mot de passe incorrect.' : /not confirmed/i.test(message) ? 'Confirme d’abord ton e-mail : ouvre le lien qu’on t’a envoyé.' : message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={creating ? 'Créer mon compte' : 'Se connecter'} onClose={onClose}>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Le même compte que dans les apps GRRRR et GRRR Care : tu retrouves ici les croquettes de tes compagnons.</p>
      <form onSubmit={submit} className="mt-6">
        {creating && <div className="mb-4"><label className={label} htmlFor="account-name">Prénom</label><input id="account-name" name="name" required minLength={2} maxLength={60} autoComplete="given-name" className={field} /></div>}
        <div className="mb-4"><label className={label} htmlFor="account-email">E-mail</label><input id="account-email" name="email" type="email" required autoComplete="email" className={field} /></div>
        <div><label className={label} htmlFor="account-password">Mot de passe</label><input id="account-password" name="password" type="password" required minLength={6} autoComplete={creating ? 'new-password' : 'current-password'} className={field} /></div>
        {error && <p role="alert" className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-primary">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-2xl bg-mint px-4 py-3 text-sm font-bold text-[#0f6b62]">{notice}</p>}
        <button type="submit" disabled={busy} className="mt-6 w-full rounded-full bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60">{busy ? 'Un instant…' : creating ? 'Créer mon compte' : 'Me connecter'}</button>
      </form>
      <button onClick={() => { setCreating(!creating); setError(''); setNotice('') }} className="mt-4 w-full text-center text-sm font-bold text-primary">{creating ? 'Déjà un compte ? Connecte-toi' : 'Pas encore de compte ? Crée-le'}</button>
    </Dialog>
  )
}

/** The account's croquettes: how many, how to earn them, and the packs to buy with money. */
export function WalletDialog({ session, balance, onClose }: { session: Session; balance: number | null; onClose: () => void }) {
  const [packs, setPacks] = useState<Pack[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    checkout<{ packs: Pack[]; open: boolean }>({ action: 'packs' }).then(({ packs, open }) => { setPacks(packs); setOpen(open) }).catch(() => {})
  }, [])

  const buy = async (pack: Pack) => {
    setError('')
    setBusy(pack.key)
    try {
      // Payment happens on Stripe's page; the croquettes arrive when it confirms
      window.location.href = (await checkout<{ url: string }>({ action: 'buy', pack: pack.key }, session)).url
    } catch (e) {
      setError((e as Error).message)
      setBusy('')
    }
  }

  return (
    <Dialog title="Mes croquettes" onClose={onClose}>
      <div className="mt-5 flex items-center gap-4 rounded-3xl bg-soft-pink p-5">
        <img src="/croquette.png" alt="" className="h-14 w-auto" />
        <div><p className="text-4xl font-black leading-none">{balance ?? '…'}</p><p className="mt-1 text-sm font-bold text-muted-foreground">croquettes à dépenser</p></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">Tes compagnons en gagnent dans les apps GRRRR et GRRR Care (cadeaux du jour, matchs, sorties). Tu peux aussi en acheter : 1 croquette = 0,50 €.</p>

      <h3 className="mt-6 text-lg font-black">Acheter des croquettes</h3>
      <div className="mt-3 grid gap-3">
        {packs.map((pack) => (
          <button key={pack.key} onClick={() => buy(pack)} disabled={!open || Boolean(busy)} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left hover:border-primary disabled:opacity-60 disabled:hover:border-border">
            <span><Croquettes amount={pack.croquettes} className="text-lg" />{pack.croquettes > 100 && <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-xs font-black text-[#0f6b62]">10 offertes</span>}</span>
            <span className="font-black text-primary">{busy === pack.key ? '…' : pack.price}</span>
          </button>
        ))}
      </div>
      {!open && <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-muted-foreground">L’achat de croquettes ouvre bientôt. En attendant, gagne-en dans les apps.</p>}
      {error && <p role="alert" className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-primary">{error}</p>}

      <p className="mt-6 truncate text-xs text-muted-foreground">Connecté : {session.user.email}</p>
      <button onClick={() => { supabase.auth.signOut(); onClose() }} className="mt-1 text-sm font-bold text-muted-foreground underline">Me déconnecter</button>
    </Dialog>
  )
}
