'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Heart, Menu, PawPrint, Search, ShoppingBag, Sparkles, X, Star, ShieldCheck, Truck, User } from 'lucide-react'
import { useAccount } from '@/lib/account'
import { AccountDialog, Croquettes, WalletDialog } from '@/components/croquettes'
import { Cart, type CartLine } from '@/components/cart'
import { PartnerProducts } from '@/components/partner-products'

const brandBoard = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ox3HUUFcTYR2D3JE2WJjqJR7tFaWoB.png'
const heroIllustration = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-pLnxVZHUY4FuQFRdnqQsxVE2UOASgA.png'

// Prices are in croquettes (1 croquette = 0,25 € when bought). The order is priced again on the server
// from the store_items table, by slug: change a price in both places.
// A product can show other photos for each version (photos), offer a second choice (option) and ask
// for what to engrave (fields); all of it travels with the order in its line's text.
type Field = { key: string; label: string; placeholder: string; max: number; required?: boolean; upper?: boolean; hint?: string }
type Product = {
  slug: string; name: string; note: string; image: string; gallery?: string[]; croquettes: number; tag: string; details: string
  variants: string[]; specs: string[]
  photos?: Record<string, string[]>
  option?: { label: string; choices: string[]; initial?: string }
  /** Pictures that explain the product, shown whole under its page */
  extras?: { src: string; alt: string }[]
  fields?: Field[]
}

const collections: Product[] = [
  { slug: 'colliers', name: 'Colliers', note: 'Confortables, stylés, 100% amour.', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FD4fwZ76MZMtIc5zRo3i9egk8s7xqm.png', croquettes: 100, tag: 'Le quotidien', details: 'Un collier doux et résistant pour les promenades de tous les jours.', variants: ['Rose signature', 'Rose poudré', 'Noir GRRRR'], specs: ['Nylon doux anti-frottement', 'Boucle sécurisée et réglable', 'Anneau métal pour médaille et laisse'],
    photos: { 'Rose poudré': ['/products/collier-rose-poudre.png'], 'Noir GRRRR': ['/products/collier-noir-grrrr.png'] },
    option: { label: 'Tour de cou', choices: ['S · 25-35 cm', 'M · 35-45 cm', 'L · 45-55 cm'], initial: 'M · 35-45 cm' } },
  { slug: 'medailles', name: 'Médailles', note: 'Son nom, son style, son histoire.', image: '/products/medaille-ronde-rose.png', croquettes: 80, tag: 'Personnalisable', details: 'Une médaille légère à personnaliser avec son prénom et votre numéro.', variants: ['Ronde rose', 'Ronde argent', 'Cœur rose'], specs: ['Acier inoxydable', 'Gravure du prénom au recto, du numéro au verso', 'Résiste à l’eau et aux aventures'],
    photos: { 'Ronde rose': ['/products/medaille-ronde-rose.png'], 'Ronde argent': ['/products/medaille-ronde-argent.png'], 'Cœur rose': ['/products/medaille-coeur-rose.png'] },
    fields: [
      { key: 'name', label: 'Prénom à graver', placeholder: 'Misty', max: 12, required: true, upper: true },
      { key: 'phone', label: 'Numéro au dos', placeholder: '06 12 34 56 78', max: 14, hint: 'Facultatif : pour qu’on puisse vous appeler s’il se perd.' },
    ] },
  { slug: 'jouets', name: 'Jouets', note: 'Pour jouer, câliner et recommencer.', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3eEf54FBQtTAiqUULzOl1C5WnnaWGV.png', gallery: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-3eEf54FBQtTAiqUULzOl1C5WnnaWGV.png', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-0ZRVmSTExY0ARBDtn6HKoyYUcBsNW7.png', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-tmnePTQtwrqZN0uoOiCNI7wPfXMjhg.png'], croquettes: 70, tag: 'Bonne humeur', details: 'Des jouets tout doux pour stimuler, jouer et partager des moments complices.', variants: ['Os câlin', 'Légumes rigolos', 'Lapin doudou'], specs: ['Tissu doux et lavable', 'Broderie GRRRR', 'Pensé pour les câlins et jeux calmes'] },
  { slug: 'friandises', name: 'Friandises', note: 'Des petites douceurs pour grands sourires.', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-M2QTsKTIhenY1eGxUZq33rAaA0FpXH.png', croquettes: 50, tag: 'Petit plaisir', details: 'Une boîte de récompenses gourmandes pour célébrer chaque petite victoire.', variants: ['Biscuits classiques', 'Mix croquant', 'Mini récompenses'], specs: ['Recette adaptée aux chiens', 'Boîte refermable', 'À offrir avec modération'] },
  { slug: 'gourde', name: 'Gourde nomade', note: 'La gourde qui devient gamelle en balade.', image: '/products/gourde-bleu.jpg', croquettes: 70, tag: 'En balade', details: 'Une gourde ronde avec sa gamelle en silicone intégrée : on relève la coque, on verse, il boit. L’eau qui reste retourne dans la gourde, puis la gamelle se replie.', variants: ['Bleu', 'Rose'], specs: ['Gamelle en silicone souple, repliable', 'Mousqueton et dragonne pour l’accrocher', 'L’eau non bue retourne dans la gourde'],
    photos: { Bleu: ['/products/gourde-bleu.jpg', '/products/gourde-rose.jpg'], Rose: ['/products/gourde-rose.jpg', '/products/gourde-bleu.jpg'] },
    extras: [{ src: '/products/gourde.webp', alt: 'Mode d’emploi de la gourde : relever la gamelle, verser, laisser boire, l’eau restante retourne dans la gourde' }] },
  { slug: 'parcours-chat', name: 'Parcours mural', note: 'Un terrain de jeu au mur, rien que pour lui.', image: '/products/parcours-chat-salon.jpg', croquettes: 300, tag: 'Pour les chats',
    details: 'Des plateformes à fixer au mur, reliées par des baguettes : votre chat grimpe, traverse, observe et se repose en hauteur. Version pont, pour des passages en lattes qui épousent les montées et descentes, ou version plateformes, pour des paliers plats. Le kit se recompose à l’envie, selon votre mur.',
    variants: ['Pont', 'Plateformes'], specs: ['5 plateformes rectangulaires et 10 baguettes de liaison', 'Vis et chevilles pour la fixation au mur', 'Une infinité de configurations'],
    photos: { Pont: ['/products/parcours-chat-pont.jpg', '/products/parcours-chat-plateforme.jpg'], Plateformes: ['/products/parcours-chat-plateforme.jpg', '/products/parcours-chat-pont.jpg'] },
    option: { label: 'Couleur', choices: ['Beige', 'Marron', 'Noir', 'Gris', 'Blanc'] },
    extras: [
      { src: '/products/parcours-chat-salon.jpg', alt: 'Un chat traverse le parcours mural au-dessus d’un canapé' },
      { src: '/products/parcours-chat-kit.jpg', alt: 'Le parcours dans la maison et les éléments du kit : 5 plateformes, 10 baguettes, vis et chevilles' },
    ] },
]

const humans = ['T-shirts GRRRR', 'Sweats', 'Tote bags', 'Mugs', 'Stickers', 'Porte-clés']

// The three shelves of the shop
const TABS = [
  { key: 'pet', label: 'Pet', title: 'Pour les animaux' },
  { key: 'the', label: 'The', title: 'Pour les humains' },
  { key: 'partners', label: 'Partenaires', title: 'Chez nos partenaires' },
] as const
type Tab = (typeof TABS)[number]['key']

const NAV: { label: string; href: string; tab?: Tab }[] = [
  { label: 'Pour les animaux', href: '#collections', tab: 'pet' },
  { label: 'Pour les humains', href: '#collections', tab: 'the' },
  { label: 'Partenaires', href: '#collections', tab: 'partners' },
  { label: 'Personnalisé', href: '#personnalise' },
]

export default function Page() {
  const { session, balance, setBalance, refresh } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [tab, setTab] = useState<Tab>('pet')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [entries, setEntries] = useState<Record<string, string>>({})
  const [missing, setMissing] = useState<string | null>(null)
  const [thanks, setThanks] = useState(false)

  const cartCount = cart.reduce((count, line) => count + line.quantity, 0)
  const title = TABS.find((item) => item.key === tab)!.title

  const openProduct = (item: Product) => {
    setSelectedProduct(item)
    setSelectedVariant(item.variants[0])
    setSelectedPhoto(0)
    setSelectedOption(item.option?.initial ?? item.option?.choices[0] ?? '')
    setEntries({})
    setMissing(null)
  }
  // The photos of the version chosen (the product's own when that version has none)
  const photosOf = (item: Product, variant: string) => item.photos?.[variant] ?? item.gallery ?? [item.image]
  const addToCart = (item: Product, variant: string, image = photosOf(item, variant)[0]) => {
    setCart((lines) => lines.some((line) => line.slug === item.slug && line.variant === variant)
      ? lines.map((line) => (line.slug === item.slug && line.variant === variant ? { ...line, quantity: Math.min(line.quantity + 1, 10) } : line))
      : [...lines, { slug: item.slug, name: item.name, variant, image, croquettes: item.croquettes, quantity: 1 }])
  }
  // From the product's page: the version, the size and the engraving, in the line's text (60 characters at most)
  const addChosen = (item: Product) => {
    const empty = item.fields?.find((field) => field.required && !entries[field.key]?.trim())
    if (empty) {
      setMissing(empty.key)
      return
    }
    const engraving = (item.fields ?? []).map((field) => entries[field.key]?.trim()).filter(Boolean).map((text) => `« ${text} »`)
    const variant = [selectedVariant, item.option ? selectedOption.split(' · ')[0] : '', ...engraving].filter(Boolean).join(' · ').slice(0, 60)
    addToCart(item, variant)
    setSelectedProduct(null)
    setCartOpen(true)
  }
  const photos = selectedProduct ? photosOf(selectedProduct, selectedVariant) : []

  // Back from the payment page: the croquettes are credited when the payment is confirmed, a moment later
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('croquettes') !== 'merci') return
    setThanks(true)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])
  useEffect(() => {
    if (!thanks || !session) return
    const timers = [1500, 5000, 12000].map((delay) => setTimeout(refresh, delay))
    return () => timers.forEach(clearTimeout)
  }, [thanks, session, refresh])

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <button className="rounded-full p-2 lg:hidden" aria-label="Ouvrir le menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
          <a href="#top" className="flex items-center gap-2" aria-label="GRRRR accueil">
            <span className="text-2xl font-black tracking-[-0.1em]"><span className="text-charcoal">G</span><span className="text-primary">RRRR</span></span>
            <PawPrint className="text-primary" size={20} fill="currentColor" />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-bold lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => <a key={item.label} href={item.href} onClick={() => item.tab && setTab(item.tab)} className="transition-colors hover:text-primary">{item.label}</a>)}
          </nav>
          <div className="flex items-center gap-1">
            <button className="hidden rounded-full p-2 hover:bg-secondary sm:block" aria-label="Rechercher"><Search size={20} /></button>
            {session ? (
              <button onClick={() => setWalletOpen(true)} aria-label={`Mes croquettes : ${balance ?? '…'}. Acheter des croquettes`} className="rounded-full bg-soft-pink px-3 py-1.5 text-sm hover:bg-secondary"><Croquettes amount={balance ?? 0} /></button>
            ) : (
              <button onClick={() => setAccountOpen(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold hover:bg-secondary"><User size={18} /><span className="hidden sm:inline">Se connecter</span></button>
            )}
            <button className="relative rounded-full p-2 hover:bg-secondary" aria-label="Panier" onClick={() => setCartOpen(true)}><ShoppingBag size={20} />{cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{cartCount}</span>}</button>
          </div>
        </div>
      </header>

      {thanks && <div role="status" className="bg-mint px-4 py-3 text-center text-sm font-bold text-[#0f6b62]">Merci ! Tes croquettes arrivent sur ton compte dans un instant. <button onClick={() => setThanks(false)} className="ml-2 underline">Fermer</button></div>}

      <section id="top" className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-10 lg:pb-16 lg:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="order-2 lg:order-1">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-soft-pink px-4 py-2 text-sm font-bold text-primary"><Sparkles size={16} /> Pour les animaux, pour toujours</p>
            <h1 className="max-w-xl text-balance text-5xl font-black leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Des produits pour leur bonheur,<br /><span className="text-primary">et le vôtre.</span></h1>
            <p className="mt-6 max-w-md text-pretty text-base leading-7 text-muted-foreground">Le quotidien devient plus doux quand on le partage avec eux. Découvrez la sélection GRRRR, imaginée avec beaucoup d’amour.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#collections" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">Découvrir la boutique <ArrowRight size={18} /></a><a href="#personnalise" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3 font-bold text-primary">Créer son match</a></div>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"><span className="flex -space-x-2"><span className="h-8 w-8 rounded-full border-2 border-background bg-[#ff9c4a]" /><span className="h-8 w-8 rounded-full border-2 border-background bg-[#a878d8]" /><span className="h-8 w-8 rounded-full border-2 border-background bg-[#ffcf4a]" /></span><span><strong className="text-foreground">+2 400</strong> compagnons déjà équipés</span></div>
          </div>
          <div className="order-1 overflow-hidden rounded-[2rem] bg-soft-pink p-3 shadow-[0_24px_70px_rgba(243,67,94,0.12)] lg:order-2"><Image src={heroIllustration} alt="Illustration GRRRR avec des animaux et un cœur" width={1200} height={1200} className="h-auto w-full rounded-[1.5rem] object-cover" priority /></div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card px-4 py-4 sm:px-6 lg:px-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm font-bold"><span className="inline-flex items-center gap-2 text-primary">Tout se paie en croquettes <img src="/croquette.png" alt="" className="h-5 w-auto" /></span><span className="hidden text-muted-foreground sm:block">Pensé pour les petites et grandes aventures</span><span className="text-muted-foreground">Créé avec amour en France</span></div></section>

      <section id="collections" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-primary">La boutique</p><h2 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">{title}</h2></div><div className="flex gap-2 rounded-full bg-soft-pink p-1 text-sm font-bold" role="tablist" aria-label="Rayons de la boutique">{TABS.map((item) => <button key={item.key} role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`rounded-full px-4 py-2 ${tab === item.key ? 'bg-primary text-primary-foreground' : 'text-primary'}`}>{item.label}</button>)}</div></div>

        {tab === 'pet' && <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{collections.map((item) => <article key={item.slug} className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-1.5 transition-transform hover:-translate-y-1 sm:rounded-3xl sm:p-3" onClick={() => openProduct(item)}><div className="relative aspect-square overflow-hidden rounded-xl bg-soft-pink sm:aspect-[1.15] sm:rounded-2xl"><Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" /><button onClick={(event) => { event.stopPropagation(); if (item.fields?.some((field) => field.required) || item.option) { openProduct(item); return } addToCart(item, item.variants[0]); setCartOpen(true) }} aria-label={`Ajouter ${item.name} au panier`} className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card text-primary shadow-md sm:bottom-3 sm:right-3 sm:h-10 sm:w-10"><ShoppingBag size={15} /></button></div><div className="px-1.5 pb-1 pt-2 sm:p-3"><h3 className="line-clamp-2 text-sm font-black leading-tight sm:text-xl">{item.name}</h3><Croquettes amount={item.croquettes} className="mt-1 text-xs text-primary sm:text-sm" /><p className="mt-1 hidden text-sm leading-5 text-muted-foreground sm:block">{item.note}</p><p className="mt-3 hidden text-sm font-bold text-primary sm:block">Voir le produit <ArrowRight className="ml-1 inline" size={14} /></p></div></article>)}</div>}

        {tab === 'the' && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{humans.map((item, index) => <div key={item} className="rounded-3xl border border-border bg-card p-3"><div className={`mb-3 flex aspect-square items-center justify-center rounded-2xl ${index % 2 === 0 ? 'bg-soft-pink' : 'bg-mint'}`}><PawPrint className="text-primary" size={44} fill="currentColor" /></div><span className="text-sm font-black leading-tight">{item}</span><span className="mt-2 block text-xs font-bold text-muted-foreground">Bientôt disponible</span></div>)}</div>}

        {tab === 'partners' && <PartnerProducts />}
      </section>

      <section id="personnalise" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-28 sm:px-6 lg:px-10"><div className="grid overflow-hidden rounded-[2rem] bg-primary text-primary-foreground lg:grid-cols-[0.8fr_1.2fr]"><div className="p-8 sm:p-12 lg:p-14"><p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground/80">Le cadeau parfait</p><h2 className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">Crée le collier de ton match.</h2><p className="mt-5 max-w-md leading-7 text-primary-foreground/85">Ajoute son prénom, sa photo et une grande dose d’amour. Un accessoire unique pour un compagnon unique.</p><button onClick={() => openProduct(collections[0])} className="mt-8 inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 font-bold text-primary">Personnaliser maintenant <ArrowRight size={18} /></button></div><div className="relative min-h-72 bg-soft-pink/70"><Image src={brandBoard} alt="Planche graphique des produits personnalisés GRRRR" fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 50vw" /></div></div></section>

      <footer className="border-t border-border bg-charcoal px-4 py-10 text-white sm:px-6 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-3xl font-black tracking-[-0.08em]"><span className="text-white">G</span><span className="text-primary">RRRR</span></p><p className="mt-2 text-sm text-white/60">La même patte, mille aventures.</p></div><div className="flex flex-wrap gap-5 text-sm font-bold text-white/75"><a href="#collections">Boutique</a><a href="#personnalise">Personnaliser</a><a href="/partenaires">Espace partenaires</a><a href="#top">À propos</a></div></div></footer>

      {selectedProduct && <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setSelectedProduct(null)}><section role="dialog" aria-modal="true" aria-labelledby="product-title" className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-background shadow-2xl sm:rounded-[2rem]" onClick={(event) => event.stopPropagation()}><div className="grid lg:grid-cols-2"><div className="bg-soft-pink p-4 sm:p-6"><div className="relative aspect-square overflow-hidden rounded-2xl bg-card sm:min-h-[420px]"><Image src={photos[selectedPhoto]} alt={`Photo ${selectedPhoto + 1} sur ${photos.length} du produit ${selectedProduct.name}`} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" /><button onClick={() => setSelectedProduct(null)} aria-label="Fermer la présentation" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-charcoal shadow"><X size={20} /></button>{photos.length > 1 && <><button onClick={() => setSelectedPhoto((selectedPhoto - 1 + photos.length) % photos.length)} aria-label="Photo précédente" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-xl font-black text-charcoal shadow">‹</button><button onClick={() => setSelectedPhoto((selectedPhoto + 1) % photos.length)} aria-label="Photo suivante" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-xl font-black text-charcoal shadow">›</button><span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-charcoal/75 px-3 py-1 text-xs font-bold text-white">{selectedPhoto + 1} / {photos.length}</span></>}</div>{photos.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{photos.map((photo, index) => <button key={photo} onClick={() => setSelectedPhoto(index)} aria-label={`Afficher la photo ${index + 1}`} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-card ${selectedPhoto === index ? 'border-primary' : 'border-transparent'}`}><Image src={photo} alt="" fill className="object-contain" sizes="64px" /></button>)}</div>}</div><div className="p-6 sm:p-9"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-soft-pink px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">{selectedProduct.tag}</span><h2 id="product-title" className="mt-4 text-4xl font-black tracking-tight">{selectedProduct.name}</h2></div><Croquettes amount={selectedProduct.croquettes} className="text-2xl text-primary" /></div><div className="mt-3 flex items-center gap-1 text-primary" aria-label="5 étoiles sur 5"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><span className="ml-2 text-sm font-bold text-muted-foreground">4,9 / 5</span></div><p className="mt-6 text-base leading-7 text-muted-foreground">{selectedProduct.details}</p><div className="mt-6"><p className="mb-3 text-sm font-black">Choisir une version</p><div className="flex flex-wrap gap-2">{selectedProduct.variants.map((variant) => <button key={variant} onClick={() => { setSelectedVariant(variant); setSelectedPhoto(0) }} className={`rounded-full border px-4 py-2 text-sm font-bold ${selectedVariant === variant ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{variant}</button>)}</div></div>{selectedProduct.option && <div className="mt-6"><p className="mb-3 text-sm font-black">{selectedProduct.option.label}</p><div className="flex flex-wrap gap-2">{selectedProduct.option.choices.map((choice) => <button key={choice} onClick={() => setSelectedOption(choice)} className={`rounded-full border px-4 py-2 text-sm font-bold ${selectedOption === choice ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{choice}</button>)}</div></div>}{selectedProduct.fields && <div className="mt-6 grid gap-4">{selectedProduct.fields.map((field) => <label key={field.key} className="grid gap-2"><span className="text-sm font-black">{field.label}{field.required && <span className="text-primary"> *</span>}</span><input value={entries[field.key] ?? ''} maxLength={field.max} placeholder={field.placeholder} onChange={(event) => { setMissing(null); setEntries({ ...entries, [field.key]: field.upper ? event.target.value.toUpperCase() : event.target.value }) }} className={`rounded-2xl border bg-card px-4 py-3 text-base font-bold tracking-wide outline-none focus:border-primary ${missing === field.key ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`} /><span className={`text-xs ${missing === field.key ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{missing === field.key ? 'À remplir pour la gravure.' : field.hint ?? `${field.max} caractères au plus.`}</span></label>)}{entries.name?.trim() && <p className="rounded-2xl bg-soft-pink px-4 py-3 text-sm font-bold">Gravure : <span className="font-black tracking-[0.15em] text-primary">{entries.name.trim()}</span>{entries.phone?.trim() ? <span className="text-muted-foreground"> · au dos {entries.phone.trim()}</span> : null}</p>}</div>}<ul className="mt-7 grid gap-3 text-sm font-bold">{selectedProduct.specs.map((spec) => <li key={spec} className="flex items-center gap-3"><ShieldCheck size={18} className="text-primary" />{spec}</li>)}</ul><button onClick={() => addChosen(selectedProduct)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-black text-primary-foreground shadow-lg shadow-primary/20">Ajouter au panier <ShoppingBag size={18} /></button><div className="mt-5 flex justify-between gap-3 border-t border-border pt-5 text-xs font-bold text-muted-foreground"><span className="flex items-center gap-2"><Truck size={16} className="text-primary" /> Expédition rapide</span><span className="flex items-center gap-2"><Heart size={16} className="text-primary" /> Fait avec amour</span></div>{selectedProduct.extras && <div className="mt-7 grid gap-3 border-t border-border pt-6"><p className="text-sm font-black">En images</p>{selectedProduct.extras.map((extra) => <img key={extra.src} src={extra.src} alt={extra.alt} loading="lazy" className="h-auto w-full rounded-2xl bg-card" />)}</div>}</div></div></section></div>}
      {menuOpen && <div className="fixed inset-0 z-50 bg-charcoal/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}><div className="h-full w-[min(86%,360px)] bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><span className="text-2xl font-black"><span className="text-charcoal">G</span><span className="text-primary">RRRR</span></span><button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X /></button></div><nav className="mt-10 flex flex-col gap-6 text-lg font-bold">{NAV.map((item) => <a key={item.label} href={item.href} onClick={() => { if (item.tab) setTab(item.tab); setMenuOpen(false) }}>{item.label}</a>)}</nav></div></div>}
      {cartOpen && <Cart lines={cart} onChange={setCart} session={session} balance={balance} onPaid={setBalance} onSignIn={() => setAccountOpen(true)} onWallet={() => setWalletOpen(true)} onClose={() => setCartOpen(false)} />}
      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} />}
      {walletOpen && session && <WalletDialog session={session} balance={balance} onClose={() => setWalletOpen(false)} />}
    </main>
  )
}
