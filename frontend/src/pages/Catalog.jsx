import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import WineCard from '../components/WineCard.jsx'
import { WINE_TYPES } from '../data/wines.js'
import { matchesWine } from '../lib/wine.js'
import Reveal from '../components/Reveal.jsx'
import { useWines } from '../hooks/useWines.js'

export default function Catalog({ initialType = null }) {
  const params = useParams()
  const location = useLocation()
  const routeType = params.type || null
  const [query, setQuery] = useState('')
  const { wines, loading, error } = useWines()

  const type = routeType || initialType

  // Filtro por bodega desde query string ?winery=...
  const wineryFilter = useMemo(() => {
    const sp = new URLSearchParams(location.search)
    return sp.get('winery') || null
  }, [location.search])

  const filtered = useMemo(() => {
    return wines
      .filter((w) => (type ? w.type === type : true))
      .filter((w) => wineryFilter
        ? (w.winery || '').toLowerCase() === wineryFilter.toLowerCase()
        : true
      )
      .filter((w) => matchesWine(w, query))
  }, [wines, type, query, wineryFilter])

  const title = wineryFilter
    ? `Bodega ${wineryFilter}`
    : type
      ? `Catálogo · ${WINE_TYPES[type] || type}`
      : 'Catálogo'

  useEffect(() => {
    const q = location?.state?.q
    if (typeof q === 'string') setQuery(q)
  }, [location?.state])

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="muted">Cargando catálogo...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ color: '#e74c3c', marginBottom: 14 }}>Error: {error}</div>
          <button className="btn" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div style={{ maxWidth: 1180 }}>
          <Reveal as="div">
            <h1 style={{ margin: '0 0 8px', fontSize: 24, letterSpacing: 0.2 }}>{title}</h1>
            <div className="muted" style={{ marginBottom: 14, lineHeight: 1.5 }}>
              {filtered.length} productos · selección curada
            </div>
          </Reveal>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <input
              className="input"
              placeholder="Buscar por nombre, varietal, región..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid gridCols3">
            {filtered.map((w, idx) => (
              <WineCard key={`${w.type}-${w.id}`} wine={w} delay={idx * 55} />
            ))}
          </div>
      </div>
    </div>
  )
}
