'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, MapPin, Phone, Tag } from 'lucide-react'
import { storeProducts, type PartnerProduct } from '@/lib/partner-products'

// The "Partenaires" shelf: products of GRRR Care partners, published from /partenaires. The store sells none
// of them: each card leads to the partner's own page, or shows where to find it, and its price is the
// partner's, in euros (croquettes only pay for what GRRRR ships itself).
export function PartnerProducts() {
  const [products, setProducts] = useState<PartnerProduct[] | null>(null)

  useEffect(() => {
    storeProducts<{ products: PartnerProduct[] }>({ action: 'list' }).then(({ products }) => setProducts(products)).catch(() => setProducts([]))
  }, [])

  if (!products) return <p className="py-10 text-center text-muted-foreground">Un instant…</p>
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <p className="text-lg font-black">Nos partenaires arrivent</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Vétérinaires, animaleries et toiletteurs partenaires de GRRR Care proposeront bientôt leurs produits ici.</p>
        <a href="/partenaires" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Vous êtes un professionnel ? <ArrowRight size={14} /></a>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">Sélectionnés chez les vétérinaires, animaleries et toiletteurs partenaires de GRRR Care. L’achat se fait directement chez eux, au prix qu’ils indiquent.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const partner = product.partner
          const link = product.url || partner?.website
          return (
            <article key={product.id} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-3">
              <div className="relative aspect-[1.15] overflow-hidden rounded-2xl bg-soft-pink">
                {product.image && <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />}
                {partner?.discount ? <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground"><Tag size={13} /> -{partner.discount} % membres GRRR</span> : null}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-start justify-between gap-2"><h3 className="text-xl font-black leading-tight">{product.name}</h3><span className="shrink-0 text-sm font-black text-primary">{product.price}</span></div>
                {product.description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{product.description}</p>}
                <p className="mt-3 flex items-start gap-1.5 text-sm font-bold"><MapPin size={15} className="mt-0.5 shrink-0 text-primary" />{[partner?.name, partner?.city].filter(Boolean).join(' · ')}</p>
                <div className="mt-auto pt-3">
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary">Voir chez le partenaire <ArrowRight className="ml-1 inline" size={14} /></a>
                  ) : partner?.phone ? (
                    <a href={`tel:${partner.phone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><Phone size={14} /> {partner.phone}</a>
                  ) : (
                    <span className="text-sm text-muted-foreground">{partner?.address}</span>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
