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
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => {
          const partner = product.partner
          const link = product.url || partner?.website
          return (
            <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-1.5 sm:rounded-3xl sm:p-3">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-soft-pink sm:aspect-[1.15] sm:rounded-2xl">
                {product.image && <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />}
                {partner?.discount ? <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs"><Tag size={12} /> -{partner.discount} %<span className="hidden sm:inline"> membres GRRR</span></span> : null}
              </div>
              <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2 sm:p-3">
                <h3 className="line-clamp-2 text-sm font-black leading-tight sm:text-xl">{product.name}</h3>
                <span className="mt-1 text-xs font-black text-primary sm:text-sm">{product.price}</span>
                {product.description && <p className="mt-1 hidden text-sm leading-5 text-muted-foreground sm:block">{product.description}</p>}
                <p className="mt-2 flex items-start gap-1 text-xs font-bold sm:mt-3 sm:gap-1.5 sm:text-sm"><MapPin size={13} className="mt-0.5 shrink-0 text-primary" /><span className="line-clamp-2">{[partner?.name, partner?.city].filter(Boolean).join(' · ')}</span></p>
                <div className="mt-auto pt-2 text-xs sm:pt-3 sm:text-sm">
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer" className="font-bold text-primary">Voir<span className="hidden sm:inline"> chez le partenaire</span> <ArrowRight className="ml-1 inline" size={14} /></a>
                  ) : partner?.phone ? (
                    <a href={`tel:${partner.phone}`} className="inline-flex items-center gap-1.5 font-bold text-primary"><Phone size={14} /> {partner.phone}</a>
                  ) : (
                    <span className="line-clamp-2 text-muted-foreground">{partner?.address}</span>
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
