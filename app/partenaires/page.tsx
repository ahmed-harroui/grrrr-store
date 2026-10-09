'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, Clock, ImagePlus, PawPrint, Store, Trash2, X } from 'lucide-react'
import { PRODUCT_CATEGORIES, storeProducts, type Partner, type PartnerProduct } from '@/lib/partner-products'

// The partners' corner of the store. It is opened from a personal link:
//   /partenaires?token=…   a partner of GRRR Care adds and removes its products (the link of its invitation)
//   /partenaires?review=…  the admin publishes or rejects one product (the link of the email sent for each one)
// Without either, it explains how to get in.

const CARE_PARTNERS = 'https://care.greatrascals.com/partenaires'
const MAX_PHOTO_BYTES = 3 * 1024 * 1024

const STATUS = {
  pending: { label: 'En attente de validation', className: 'bg-[#fff3d6] text-[#8a5a00]', icon: Clock },
  published: { label: 'En ligne', className: 'bg-mint text-[#0f6b62]', icon: Check },
  rejected: { label: 'Refusé', className: 'bg-secondary text-muted-foreground', icon: X },
}

interface Mine {
  partner: Partner
  isPartner: boolean
  products: PartnerProduct[]
  max?: number
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-2" aria-label="GRRRR accueil">
            <span className="text-2xl font-black tracking-[-0.1em]"><span className="text-charcoal">G</span><span className="text-primary">RRRR</span></span>
            <PawPrint className="text-primary" size={20} fill="currentColor" />
          </a>
          <span className="inline-flex items-center gap-2 rounded-full bg-soft-pink px-4 py-2 text-sm font-bold text-primary"><Store size={16} /> Espace partenaires</span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">{children}</div>
    </main>
  )
}

function Notice({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-8 text-center sm:p-10">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-soft-pink"><PawPrint className="text-primary" size={28} fill="currentColor" /></div>
      <h1 className="text-3xl font-black tracking-[-0.04em]">{title}</h1>
      <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
      {children}
    </div>
  )
}

function ProductCard({ product, footer }: { product: PartnerProduct; footer?: React.ReactNode }) {
  const status = STATUS[product.status]
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card p-3">
      <div className="relative aspect-[1.15] overflow-hidden rounded-2xl bg-soft-pink">
        {product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" />}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${status.className}`}><status.icon size={13} /> {status.label}</span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-black leading-tight">{product.name}</h3><span className="shrink-0 text-sm font-black text-primary">{product.price}</span></div>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{product.category}</p>
        {product.description && <p className="mt-2 text-sm leading-5 text-muted-foreground">{product.description}</p>}
        {footer}
      </div>
    </article>
  )
}

function Dashboard({ token }: { token: string }) {
  const [mine, setMine] = useState<Mine | null>(null)
  const [problem, setProblem] = useState('')
  const [photo, setPhoto] = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState(false)

  const load = () => storeProducts<Mine>({ action: 'mine', token }).then(setMine).catch((e) => setProblem(e.message))
  useEffect(() => { load() }, [token])

  const choosePhoto = (file?: File) => {
    setError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Choisissez une photo au format JPG, PNG ou WebP.')
    if (file.size > MAX_PHOTO_BYTES) return setError('La photo dépasse 3 Mo.')
    const reader = new FileReader()
    reader.onload = () => setPhoto({ base64: String(reader.result).split(',')[1], type: file.type, preview: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>
    setError('')
    setAdded(false)
    if (!photo) return setError('Ajoutez une photo du produit.')
    setSaving(true)
    try {
      await storeProducts({ action: 'add', token, name: fields.name, price: fields.price, category: fields.category, description: fields.description, url: fields.url, image: { base64: photo.base64, type: photo.type } })
      form.reset()
      setPhoto(null)
      setAdded(true)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (product: PartnerProduct) => {
    if (!window.confirm(`Retirer « ${product.name} » du store ?`)) return
    await storeProducts({ action: 'remove', token, id: product.id }).catch((e) => setError(e.message))
    await load()
  }

  if (problem) return <Notice title="Lien invalide" text={problem} />
  if (!mine) return <Notice title="Un instant…" text="Nous ouvrons votre espace partenaire." />
  if (!mine.isPartner) {
    return (
      <Notice title="Confirmez d’abord votre partenariat" text={`${mine.partner.name} n’est pas encore partenaire GRRR Care. Une fois le partenariat confirmé, revenez ici avec le même lien pour ajouter vos produits.`}>
        <a href={`https://care.greatrascals.com/partenaire?token=${token}`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Confirmer mon partenariat <ArrowRight size={18} /></a>
      </Notice>
    )
  }

  const full = mine.products.length >= (mine.max ?? 20)
  const field = 'w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary'
  const label = 'mb-1.5 block text-sm font-black'

  return (
    <>
      <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-primary">Espace partenaire</p>
      <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">{mine.partner.name}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Ajoutez vos produits au store GRRRR. Chaque produit est vérifié par notre équipe, puis affiché dans la rubrique « Chez nos partenaires » avec votre nom et le lien vers chez vous.{mine.partner.discount ? ` Votre réduction de ${mine.partner.discount} % pour les membres GRRR y figure aussi.` : ''}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="h-fit rounded-[2rem] border border-border bg-card p-6 sm:p-8" noValidate>
          <h2 className="text-2xl font-black">Ajouter un produit</h2>

          <label className="mt-6 flex aspect-[1.6] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-soft-pink text-center text-sm font-bold text-primary">
            {photo ? <img src={photo.preview} alt="Aperçu de la photo" className="h-full w-full object-cover" /> : <><ImagePlus size={30} /> Ajouter une photo<span className="text-xs font-bold text-muted-foreground">JPG, PNG ou WebP · 3 Mo max</span></>}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => choosePhoto(event.target.files?.[0])} />
          </label>

          <div className="mt-5"><label className={label} htmlFor="name">Nom du produit *</label><input id="name" name="name" required maxLength={80} className={field} placeholder="Harnais confort taille M" /></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="price">Prix en € *</label><input id="price" name="price" required inputMode="decimal" maxLength={8} className={field} placeholder="24,90" /></div>
            <div><label className={label} htmlFor="category">Catégorie *</label><select id="category" name="category" className={field} defaultValue="accessories">{PRODUCT_CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}</select></div>
          </div>
          <div className="mt-4"><label className={label} htmlFor="description">Description</label><textarea id="description" name="description" maxLength={600} rows={4} className={field} placeholder="Matière, tailles, pour quel animal…" /></div>
          <div className="mt-4"><label className={label} htmlFor="url">Lien pour l’acheter ou le réserver</label><input id="url" name="url" maxLength={300} className={field} placeholder="www.votre-site.fr/produit" /><p className="mt-1.5 text-xs text-muted-foreground">Sans lien, le store indique votre adresse et votre téléphone.</p></div>

          {error && <p role="alert" className="mt-5 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-primary">{error}</p>}
          {added && <p role="status" className="mt-5 rounded-2xl bg-mint px-4 py-3 text-sm font-bold text-[#0f6b62]">Produit envoyé. Il sera en ligne dès que notre équipe l’aura validé.</p>}
          {full && <p className="mt-5 text-sm font-bold text-muted-foreground">Vous avez atteint la limite de {mine.max} produits. Retirez-en un pour en ajouter un autre.</p>}

          <button type="submit" disabled={saving || full} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60">{saving ? 'Envoi…' : 'Proposer ce produit'} <ArrowRight size={18} /></button>
        </form>

        <section aria-label="Vos produits">
          <h2 className="text-2xl font-black">Vos produits <span className="text-muted-foreground">({mine.products.length})</span></h2>
          {mine.products.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center leading-7 text-muted-foreground">Aucun produit pour l’instant. Le premier que vous ajoutez apparaîtra ici.</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {mine.products.map((product) => (
                <ProductCard key={product.id} product={product} footer={<button onClick={() => remove(product)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary"><Trash2 size={15} /> Retirer</button>} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Review({ review }: { review: string }) {
  const [product, setProduct] = useState<PartnerProduct | null>(null)
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    storeProducts<{ product: PartnerProduct }>({ action: 'review-info', review }).then(({ product }) => setProduct(product)).catch((e) => setProblem(e.message))
  }, [review])

  const decide = async (decision: 'publish' | 'reject') => {
    setBusy(true)
    try {
      setProduct((await storeProducts<{ product: PartnerProduct }>({ action: 'review', review, decision })).product)
    } catch (e) {
      setProblem((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (problem) return <Notice title="Validation impossible" text={problem} />
  if (!product) return <Notice title="Un instant…" text="Nous cherchons le produit à valider." />

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-primary">Validation</p>
      <h1 className="text-3xl font-black tracking-[-0.04em]">Produit proposé par {product.partner?.name}</h1>
      <p className="mt-2 text-muted-foreground">{[product.partner?.city, product.partner?.phone, product.partner?.website].filter(Boolean).join(' · ')}</p>
      <div className="mt-6"><ProductCard product={product} footer={product.url ? <a href={product.url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm font-bold text-primary">{product.url}</a> : null} /></div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => decide('reject')} disabled={busy || product.status === 'rejected'} className="rounded-full border border-border bg-card px-6 py-4 font-black disabled:opacity-50">Refuser</button>
        <button onClick={() => decide('publish')} disabled={busy || product.status === 'published'} className="rounded-full bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50">Publier</button>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">Vous pouvez changer d’avis à tout moment avec ce même lien.</p>
    </div>
  )
}

export default function PartnersPage() {
  // Read on the client: the page is static and the links are personal
  const [params, setParams] = useState<URLSearchParams | null>(null)
  useEffect(() => setParams(new URLSearchParams(window.location.search)), [])

  const token = params?.get('token')
  const review = params?.get('review')

  return (
    <Shell>
      {!params ? null : review ? <Review review={review} /> : token ? <Dashboard token={token} /> : (
        <Notice title="L’espace des partenaires GRRR Care" text="Vétérinaires, animaleries, toiletteurs : les partenaires de GRRR Care proposent ici leurs produits aux propriétaires d’animaux. Ouvrez cette page depuis le lien personnel reçu par e-mail pour ajouter les vôtres.">
          <a href={CARE_PARTNERS} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Devenir partenaire <ArrowRight size={18} /></a>
        </Notice>
      )}
    </Shell>
  )
}
