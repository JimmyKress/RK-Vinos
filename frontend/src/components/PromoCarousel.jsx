import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { coverSvgDataUri } from '../lib/covers.js'
import { CONFIG_INIT } from '../pages/Admin.jsx'

const TONES = ['espumante', 'tinto', 'blanco']

function loadSlidesConfig() {
  try {
    const raw = localStorage.getItem('rk_admin_config')
    if (raw) {
      const parsed = JSON.parse(raw)
      // Si todos los slides son del tipo 'none' (viejos sin imagen), usa los nuevos por defecto
      if (parsed.slides && parsed.slides.every(s => s.mediaType === 'none')) {
        return CONFIG_INIT.slides
      }
      return parsed.slides
    }
  } catch {}
  return CONFIG_INIT.slides
}

export default function PromoCarousel() {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [slidesConfig, setSlidesConfig] = useState(loadSlidesConfig)

  useEffect(() => {
    function onUpdate() { setSlidesConfig(loadSlidesConfig()) }
    window.addEventListener('rk_config_updated', onUpdate)
    return () => window.removeEventListener('rk_config_updated', onUpdate)
  }, [])

  const slides = useMemo(
    () => slidesConfig
      .filter(s => s.published !== false) // Solo slides publicados
      .map((s, i) => ({
        id: `promo-${i + 1}`,
        title:    s.title,
        subtitle: s.subtitle,
        tone:     TONES[i % TONES.length],
        to:       '/catalogo',
        mediaType: s.mediaType || 'none',
        mediaUrl: s.mediaUrl || ''
      })),
    [slidesConfig]
  )

  const backgrounds = useMemo(() => {
    return slides.map((s) =>
      coverSvgDataUri({ title: s.title, subtitle: s.subtitle, tone: s.tone })
    )
  }, [slides])

  function scrollTo(i) {
    const el = trackRef.current
    if (!el) return
    const target = el.querySelector(`[data-slide-index="${i}"]`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setIndex(i)
  }

  function next() {
    scrollTo((index + 1) % slides.length)
  }

  function prev() {
    scrollTo((index - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onScroll = () => {
      const children = Array.from(el.children)
      const left = el.scrollLeft
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const dist = Math.abs(child.offsetLeft - left)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      setIndex(best)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    return undefined
  }, [])

  // No mostrar nada si no hay slides publicados
  if (slides.length === 0) {
    return null
  }

  return (
    <section className="promoBar" aria-label="Promociones">
      <div className="promoFull">
        <div className="promoTrack" ref={trackRef}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="promoSlide"
              data-slide-index={i}
              style={{ 
                backgroundImage: s.mediaType === 'none' || !s.mediaUrl ? `url('${backgrounds[i]}')` : 'none',
                position: 'relative'
              }}
            >
              {/* Media de fondo (imagen o video) */}
              {s.mediaType === 'image' && s.mediaUrl && (
                <div
                  className="promoMediaBg"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url('${s.mediaUrl}')`,
                    backgroundSize: '100% auto',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 0,
                    backgroundColor: '#000'
                  }}
                />
              )}
              
              {s.mediaType === 'video' && s.mediaUrl && (
                <video 
                  className="promoMediaBg"
                  src={s.mediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                  }}
                />
              )}

              <div className="promoOverlay" />
              <div className="container">
                <div className="promoContent">
                  <div className="promoTitle">{s.title}</div>
                  <div className="promoSubtitle">{s.subtitle}</div>
                  {i === 0 && (
                    <a className="btn btnPrimary btnSm promoCta" href="/seleccion-emblematica.html" target="_blank" rel="noopener noreferrer">
                      Ver →
                    </a>
                  )}
                  {i === 1 && (
                    <a className="btn btnPrimary btnSm promoCta" href="/listado.html" target="_blank" rel="noopener noreferrer">
                      Ver →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="promoBtn promoBtnLeft" type="button" onClick={prev} aria-label="Anterior">
          ‹
        </button>
        <button className="promoBtn promoBtnRight" type="button" onClick={next} aria-label="Siguiente">
          ›
        </button>
      </div>

      <div className="container">
        <div className="promoDots" aria-label="Paginación">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`promoDot ${i === index ? 'promoDotActive' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`Ir a ${s.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
