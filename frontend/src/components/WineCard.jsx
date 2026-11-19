import React from 'react'
import { Link } from 'react-router-dom'
import { WINE_TYPES, formatPriceARS } from '../data/wines.js'
import { useCart } from '../context/CartContext.jsx'
import Reveal from './Reveal.jsx'
import { coverSvgDataUri } from '../lib/covers.js'
import { slugify } from '../lib/wine.js'

export default function WineCard({ wine, delay = 0 }) {
  const cart = useCart()

  const cover = wine.image || coverSvgDataUri({
    title: wine.name,
    subtitle: `${wine.varietal} · ${wine.region}`,
    tone: wine.type
  })

  const slug = slugify(wine.name)

  return (
    <Reveal as="article" className="productCard" delay={delay}>
      <Link
        className="productCardCover"
        to={`/vino/${slug}`}
        target="_blank"
        rel="noreferrer"
        style={{ backgroundImage: `url('${cover}')` }}
        aria-label={`Ver ${wine.name}`}
      >
        {/*<div className="freeShip">GRATIS</div>*/}
      </Link>

      <div className="productCardBody">
        <div className="productName" style={{ fontWeight: 750 }}>{wine.name}</div>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>
          {wine.varietal} · {WINE_TYPES[wine.type] || wine.type} · {wine.volumeMl}ml
        </div>

        <div className="productCardFooter">
          <div className="price">{formatPriceARS(wine.price || 0)}</div>
          <div className="productCardActions">
            <button className="btn btnPrimary btnSm" onClick={() => cart.add(wine.id)}>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
