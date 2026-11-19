import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Truck, Wine, ShieldCheck, MessageCircle } from 'lucide-react'
import WineCard from '../components/WineCard.jsx'
import Reveal from '../components/Reveal.jsx'
import { coverSvgDataUri } from '../lib/covers.js'
import { useWines } from '../hooks/useWines.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getReviews, createReview, deleteReview } from '../api/axiosDrinks.js'
import { CONFIG_INIT } from './Admin.jsx'

// ─── helpers ──────────────────────────────────────────────────────────────────
function loadHeroConfig() {
  try {
    const raw = localStorage.getItem('rk_admin_config')
    if (raw) return JSON.parse(raw).hero || CONFIG_INIT.hero
  } catch {}
  return CONFIG_INIT.hero
}

function StarRating({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: size,
            cursor: onChange ? 'pointer' : 'default',
            color: n <= (hovered || value) ? '#f5a623' : '#ddd',
            transition: 'color 0.15s',
            lineHeight: 1,
            userSelect: 'none'
          }}
        >★</span>
      ))}
    </div>
  )
}

function Avatar({ user, size = 44 }) {
  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={user.user_name || user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  const initial = (user?.user_name || user?.name || 'U').charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #5a1f3f, #b01a2c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.4
    }}>{initial}</div>
  )
}

// ─── Modal verificación de edad ───────────────────────────────────────────────
function AgeVerificationModal({ onConfirm, onReject }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: 20, animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px',
        maxWidth: 560, width: '100%', textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)', animation: 'slideInUp 0.4s ease-out'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg,#5a1f3f,#b01a2c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
        }}>🍷</div>
        <h2 style={{ margin: '0 0 20px', fontSize: 26, fontWeight: 800, color: '#1a0a0a' }}>
          AVISO IMPORTANTE
        </h2>
        <div style={{
          margin: '0 0 24px', fontSize: 15, color: '#555', lineHeight: 1.8,
          textAlign: 'left', background: '#faf7f5', padding: 20, borderRadius: 8,
          border: '1px solid #e8ddd5'
        }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#333' }}>
            Este es un sitio de venta de bebidas alcohólicas.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            El acceso está permitido únicamente a personas <strong>mayores de 18 años</strong>.
          </p>
          <p style={{ margin: 0 }}>
            Al continuar, usted declara que tiene 18 años o más y es legalmente apto para adquirir productos alcohólicos.
          </p>
        </div>
        <p style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700, color: '#1a0a0a' }}>
          ¿Es usted mayor de 18 años?
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onConfirm} className="btn btnPrimary" style={{ minWidth: 180, padding: '14px 32px', fontSize: 15 }}>
            ✓ Sí, soy mayor de 18
          </button>
          <button onClick={onReject} className="btn" style={{ minWidth: 180, padding: '14px 32px', fontSize: 15, background: '#000000', color: '#ffffff', border: '1px solid #333333' }}>
            ✗ No, soy menor de 18
          </button>
        </div>
        <p style={{ margin: '20px 0 0', fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
          El consumo de bebidas alcohólicas en exceso es perjudicial para la salud.<br />
          Venta prohibida a menores de 18 años.
        </p>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const location = useLocation()
  const { wines } = useWines()
  const { user } = useAuth()
  const featured = useMemo(() => wines.filter(w => w.featured).slice(0, 12), [wines])
  const featuredRef = useRef(null)
  const scrollAnimRef = useRef(null)
  const [heroConfig, setHeroConfig] = useState(loadHeroConfig)
  const [showAge, setShowAge] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingReview, setEditingReview] = useState(false)

  // Verificación de edad
  useEffect(() => {
    if (!sessionStorage.getItem('rk_age_verified')) {
      setShowAge(true)
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [])
  useEffect(() => {
    document.body.style.overflow = showAge ? 'hidden' : 'unset'
  }, [showAge])

  // Hero config listener
  useEffect(() => {
    const onUpdate = () => setHeroConfig(loadHeroConfig())
    window.addEventListener('rk_config_updated', onUpdate)
    return () => window.removeEventListener('rk_config_updated', onUpdate)
  }, [])

  // Check for order success
  useEffect(() => {
    if (location.state?.orderSuccess) {
      setOrderSuccess(true)
      setOrderMessage(location.state.message || '¡Pedido realizado con éxito!')
      // Clear the state after showing
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Cargar reseñas
  const fetchReviews = useCallback(async () => {
    try {
      const data = await getReviews()
      setReviews(data)
    } catch {}
  }, [])
  useEffect(() => { fetchReviews() }, [fetchReviews])

  // Carousel
  const updateScrollButtons = useCallback(() => {
    const el = featuredRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = featuredRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    return () => el.removeEventListener('scroll', updateScrollButtons)
  }, [featured, updateScrollButtons])

  function scrollFeatured(dir) {
    const el = featuredRef.current
    if (!el) return
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current)
    const distance = 236 * dir
    const duration = 600
    const startPos = el.scrollLeft
    const startTime = performance.now()
    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1)
      el.scrollLeft = startPos + distance * easeOutExpo(t)
      if (t < 1) { scrollAnimRef.current = requestAnimationFrame(step) }
      else { scrollAnimRef.current = null; updateScrollButtons() }
    }
    scrollAnimRef.current = requestAnimationFrame(step)
  }

  // Enviar / editar reseña
  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!user) return
    if (!reviewComment.trim()) { setReviewError('Escribí un comentario'); return }
    setReviewLoading(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      await createReview(user.id, reviewRating, reviewComment)
      setReviewSuccess(editingReview ? '¡Reseña actualizada!' : '¡Gracias por tu reseña!')
      setEditingReview(false)
      await fetchReviews()
      setTimeout(() => setReviewSuccess(''), 4000)
    } catch (err) {
      setReviewError(err.response?.data?.mensaje || 'Error al enviar la reseña')
    } finally {
      setReviewLoading(false)
    }
  }

  // Activar modo edición cargando la reseña actual
  function startEditReview() {
    if (myReview) {
      setReviewRating(myReview.rating)
      setReviewComment(myReview.comment)
    }
    setReviewError('')
    setReviewSuccess('')
    setEditingReview(true)
  }

  function cancelEditReview() {
    setEditingReview(false)
    setReviewError('')
    setReviewSuccess('')
  }

  // Eliminar reseña propia
  async function handleDeleteReview(id) {
    if (!user) return
    try {
      await deleteReview(id, user.id)
      await fetchReviews()
    } catch {}
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const myReview = user ? reviews.find(r => String(r.user_id) === String(user.id)) : null
  const userHasReview = !!myReview

  // Precargar datos del formulario cuando el usuario ya tiene reseña
  useEffect(() => {
    if (myReview && !editingReview) {
      setReviewRating(myReview.rating)
      setReviewComment(myReview.comment)
    }
  }, [myReview?.id])

  return (
    <div>
      {showAge && (
        <AgeVerificationModal
          onConfirm={() => { sessionStorage.setItem('rk_age_verified', 'true'); setShowAge(false) }}
          onReject={() => { window.location.href = 'https://www.google.com' }}
        />
      )}

      {orderSuccess && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 99999, padding: '20px 32px',
          background: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
          color: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0, 200, 83, 0.4)',
          display: 'flex', alignItems: 'center', gap: 12, maxWidth: 600, width: '90%',
          animation: 'slideInDown 0.5s ease-out'
        }}>
          <span style={{ fontSize: 28 }}>✓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>¡Pedido realizado con éxito!</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{orderMessage}</div>
          </div>
          <button
            onClick={() => setOrderSuccess(false)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="homeHero" style={{ backgroundImage: "url('/img/quienesSomos.jpg')" }}>
        <div className="homeHeroOverlay" />
        <div className="container homeHeroContent">
          <Reveal delay={0}>
            <p className="homeHeroEyebrow">Bienvenido a</p>
            <h1 className="homeHeroTitle">{heroConfig?.title || 'RK Vinos'}</h1>
            <p className="homeHeroSubtitle">{heroConfig?.subtitle || 'Los mejores vinos argentinos, en tu puerta'}</p>
            <div className="homeHeroBtns">
              <Link to="/catalogo" className="btn btnPrimary" style={{ fontSize: 15, padding: '13px 32px' }}>
                Ver productos
              </Link>
              <a href="#quienes-somos" className="btn" style={{ fontSize: 15, padding: '13px 32px', color: '#fff', borderColor: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)' }}>
                Quiénes somos
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── BADGES ── */}
      <section className="homeBadgesBar">
        <div className="container homeBadgesList">
          {[
            { icon: <Truck size={24} style={{ color: '#3b82f6' }} />, label: 'Envío' },
            { icon: <Wine size={24} style={{ color: '#9333ea' }} />, label: 'Selección curada' },
            { icon: <ShieldCheck size={24} style={{ color: '#10b981' }} />, label: 'Pago seguro' },
            { icon: <MessageCircle size={24} style={{ color: '#f59e0b' }} />, label: 'Atención personalizada' },
          ].map(b => (
            <div key={b.label} className="homeBadge">
              <span className="homeBadgeIcon">{b.icon}</span>
              <span className="homeBadgeLabel">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESTACADOS ── */}
      <section className="featuredSection">
        <div className="container">
          <div className="featuredHeader">
            <div>
              <Reveal as="p" className="sectionTitle" delay={40}>Selección especial</Reveal>
              <Reveal as="h2" className="featuredTitle" delay={80}>
                Vinos <span>Destacados</span>
              </Reveal>
              <Reveal as="p" className="featuredSubtitle" delay={100}>
                Nuestra selección curada de los mejores vinos
              </Reveal>
            </div>
            {/*<Reveal delay={120}>
              <Link to="/catalogo" className="btn" style={{ whiteSpace: 'nowrap' }}>
                Ver todos →
              </Link>
            </Reveal>*/}
          </div>

          <div className="carouselWrap">
            <button className="carouselBtn" type="button" onClick={() => scrollFeatured(-1)} aria-label="Anterior"
              style={{ opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
              ‹
            </button>
            <div className="carousel" ref={featuredRef}>
              {featured.map((w, idx) => (
                <div className="carouselItem" key={`${w.type}-${w.id}`}>
                  <WineCard wine={w} delay={idx * 50} />
                </div>
              ))}
            </div>
            <button className="carouselBtn" type="button" onClick={() => scrollFeatured(1)} aria-label="Siguiente"
              style={{ opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section className="whoSection" id="quienes-somos">
        <div className="container whoGrid">
          <Reveal className="whoText" delay={60}>
            <p className="sectionTitle">Nuestra historia</p>
            <h2 className="whoTitle">¿Quiénes somos?</h2>
            <p className="whoDesc">
              RK Vinos nació de la pasión por los vinos argentinos. Somos una vinoteca online
              dedicada a acercar las mejores etiquetas del país — desde los valles mendocinos
              hasta los viñedos de altura de Salta — directamente a tu mesa.
            </p>
            <p className="whoDesc">
              Trabajamos con bodegas seleccionadas, priorizando calidad, historia y terroir.
              Cada vino que ofrecemos fue probado y elegido con criterio, para que vos
              puedas descubrir sin riesgo.
            </p>
            <div className="whoStats">
              <div className="whoStat">
                <span className="whoStatNum">+40</span>
                <span className="whoStatLabel">Vinos seleccionados</span>
              </div>
              <div className="whoStat">
                <span className="whoStatNum">15+</span>
                <span className="whoStatLabel">Bodegas asociadas</span>
              </div>
              {/*<div className="whoStat">
                <span className="whoStatNum">100%</span>
                <span className="whoStatLabel">Vinos argentinos</span>
              </div>*/}
            </div>
            <Link to="/catalogo" className="btn btnPrimary" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              Explorar catálogo →
            </Link>
          </Reveal>
          <Reveal className="whoImageWrap" delay={120}>
            <div className="whoImgGrid">
              <div className="whoImgCell">
                <img src="/img/quienes1.jpg" alt="RK Vinos" />
              </div>
              <div className="whoImgCell">
                <img src="/img/quienes2.jpg" alt="RK Vinos" />
              </div>
              <div className="whoImgCell">
                <img src="/img/quienes3.jpg" alt="RK Vinos" />
              </div>
              <div className="whoImgCell">
                <img src="/img/quienes4.jpg" alt="RK Vinos" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACTO + REDES ── */}
      <section className="ctaBannerSection">
        {/* Panel izquierdo — WhatsApp */}
        <a
          href="https://wa.me/5491140000000"
          target="_blank"
          rel="noreferrer"
          className="ctaBannerPanel ctaBannerLeft"
        >
          <div className="ctaBannerImg" style={{ backgroundImage: "url('/img/ramas.jpg')" }} />
          <div className="ctaBannerOverlay" />
          <div className="ctaBannerContent">
            <svg className="ctaBannerIcon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <h3 className="ctaBannerTitle">¿Tenés alguna consulta?</h3>
            <p className="ctaBannerSub">Escribinos a nuestro whatsapp</p>
          </div>
        </a>

        {/* Panel derecho — Instagram */}
        <a
          href="https://instagram.com/rkvinos"
          target="_blank"
          rel="noreferrer"
          className="ctaBannerPanel ctaBannerRight"
        >
          <div className="ctaBannerImg" style={{ backgroundImage: "url('/img/uva.jpg')" }} />
          <div className="ctaBannerOverlay" />
          <div className="ctaBannerContent">
            <svg className="ctaBannerIcon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <h3 className="ctaBannerTitle">Seguinos en Instagram</h3>
            <p className="ctaBannerSub">Y enterate de todas las novedades</p>
          </div>
        </a>
      </section>

      {/* ── BODEGAS ── */}
      <section className="winerySection">
        <div className="winerySectionInner">
          <p className="winerySectionEyebrow">Nuestras bodegas</p>
          <h2 className="winerySectionTitle">Trabajamos con los mejores</h2>
        </div>
        <div className="wineryTrackWrap">
          <div className="wineryTrack">
            {/* Lista duplicada para loop continuo — 26 items en total */}
            {[
              { name: 'Bianchi',               logo: '/img/bianchi.png'   },
              { name: 'Bousquet',              logo: '/img/bousquet.jpg'  },
              { name: 'Catena Zapata',         logo: '/img/zapata.png'    },
              { name: 'Del Desierto',          logo: '/img/desierto.png'  },
              { name: 'El Esteco',             logo: '/img/esteco.jpg'    },
              { name: 'Jorge Rubio',           logo: '/img/jorge.png'     },
              { name: 'La Rural',              logo: '/img/rural.jpg'     },
              { name: 'Lamadrid',              logo: '/img/lamadrid.jpg'  },
              { name: 'Las Arcas de Tolombón', logo: '/img/arcas.png'     },
              { name: 'Luigi Bosca',           logo: '/img/luigi.png'     },
              { name: 'San Pedro de Yacochuya',logo: '/img/pedro.jpg'     },
              { name: 'Trapiche',              logo: '/img/Trapiche.png'  },
              { name: 'Viña Las Perdices',     logo: '/img/viña.png'      },
              // segunda copia para el loop
              { name: 'Bianchi-2',             logo: '/img/bianchi.png'   },
              { name: 'Bousquet-2',            logo: '/img/bousquet.jpg'  },
              { name: 'Catena Zapata-2',       logo: '/img/zapata.png'    },
              { name: 'Del Desierto-2',        logo: '/img/desierto.png'  },
              { name: 'El Esteco-2',           logo: '/img/esteco.jpg'    },
              { name: 'Jorge Rubio-2',         logo: '/img/jorge.png'     },
              { name: 'La Rural-2',            logo: '/img/rural.jpg'     },
              { name: 'Lamadrid-2',            logo: '/img/lamadrid.jpg'  },
              { name: 'Las Arcas-2',           logo: '/img/arcas.png'     },
              { name: 'Luigi Bosca-2',         logo: '/img/luigi.png'     },
              { name: 'San Pedro-2',           logo: '/img/pedro.jpg'     },
              { name: 'Trapiche-2',            logo: '/img/Trapiche.png'  },
              { name: 'Viña Las Perdices-2',   logo: '/img/viña.png'      },
            ].map(({ name, logo }) => (
              <div key={name} className="wineryCard">
                <img
                  src={logo}
                  alt={name.replace(/-2$/, '')}
                  className="wineryCardImg"
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }}
                />
                <span className="wineryCardName wineryCardFallback" style={{ display: 'none' }}>{name.replace(/-2$/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEÑAS ── */}
      <section className="reviewsSection">
        <div className="container">
          <div className="reviewsHeader">
            <Reveal>
              <p className="sectionTitle" style={{ color: 'rgba(255,255,255,0.6)' }}>Opiniones reales</p>
              <h2 className="reviewsTitle">Lo que dicen nuestros clientes</h2>
              {avgRating && (
                <div className="reviewsAvg">
                  <StarRating value={Math.round(avgRating)} size={32} />
                  <span className="reviewsAvgNum">{avgRating}</span>
                  <span className="reviewsAvgCount">({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})</span>
                </div>
              )}
            </Reveal>
          </div>

          {/* Grid de reseñas */}
          {reviews.length > 0 && (
            <div className="reviewsGrid">
              {reviews.map((r, i) => (
                <Reveal key={r.id} delay={i * 50} className="reviewCard">
                  <div className="reviewCardTop">
                    <Avatar user={r} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="reviewCardName">{r.user_name}</div>
                      <StarRating value={r.rating} size={16} />
                    </div>
                    {user && String(user.id) === String(r.user_id) && (
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        title="Eliminar mi reseña"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, padding: 0, lineHeight: 1 }}
                      >×</button>
                    )}
                  </div>
                  <p className="reviewCardComment">"{r.comment}"</p>
                  <span className="reviewCardDate">
                    {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </Reveal>
              ))}
            </div>
          )}

          {/* Formulario */}
          <Reveal className="reviewFormWrap" delay={80}>
            {user ? (
              !userHasReview ? (
                /* ── Formulario nueva reseña ── */
                <form className="reviewForm" onSubmit={handleSubmitReview}>
                  <div className="reviewFormHeader">
                    <Avatar user={{ profile_picture: user.profile_picture, user_name: user.name }} size={48} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{user.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Dejá tu opinión</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Tu calificación:</span>
                    <StarRating value={reviewRating} onChange={setReviewRating} size={30} />
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span>💬</span>
                    <span>Solo se permite <strong style={{ color: 'rgba(255,255,255,0.8)' }}>una reseña por usuario</strong>. Debe ser respetuosa. Comentarios ofensivos o inapropiados serán eliminados.</span>
                  </div>
                  <textarea
                    className="reviewFormTextarea"
                    placeholder="Contanos tu experiencia con RK Vinos..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    required
                  />
                  {reviewError && <p style={{ color: '#f87171', margin: 0, fontSize: 13 }}>{reviewError}</p>}
                  {reviewSuccess && <p style={{ color: '#4ade80', margin: 0, fontSize: 13 }}>{reviewSuccess}</p>}
                  <button type="submit" className="btn btnPrimary" disabled={reviewLoading} style={{ alignSelf: 'flex-end' }}>
                    {reviewLoading ? 'Enviando...' : 'Publicar reseña'}
                  </button>
                </form>
              ) : (
                /* ── Ya tiene reseña: muestra formulario con lápiz ── */
                <form className="reviewForm" onSubmit={handleSubmitReview}>
                  {/* Header con lápiz */}
                  <div className="reviewFormHeader">
                    <Avatar user={{ profile_picture: user.profile_picture, user_name: user.name }} size={48} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{user.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                        {editingReview ? 'Editando tu reseña...' : 'Tu reseña publicada'}
                      </div>
                    </div>
                    {/* Lápiz de edición */}
                    {!editingReview && (
                      <button
                        type="button"
                        onClick={startEditReview}
                        title="Editar reseña"
                        style={{
                          background: 'rgba(255,255,255,0.10)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 8,
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          fontSize: 16,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'background 0.2s',
                          flexShrink: 0
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                      >
                        ✏️ <span style={{ fontSize: 12, fontWeight: 600 }}>Editar</span>
                      </button>
                    )}
                  </div>

                  {/* Estrellas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Tu calificación:</span>
                    <StarRating value={reviewRating} onChange={editingReview ? setReviewRating : undefined} size={30} />
                  </div>

                  {/* Textarea */}
                  <textarea
                    className="reviewFormTextarea"
                    placeholder="Contanos tu experiencia con RK Vinos..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    disabled={!editingReview}
                    style={{ opacity: editingReview ? 1 : 0.6, cursor: editingReview ? 'text' : 'default' }}
                    required
                  />

                  {reviewError && <p style={{ color: '#f87171', margin: 0, fontSize: 13 }}>{reviewError}</p>}
                  {reviewSuccess && <p style={{ color: '#4ade80', margin: 0, fontSize: 13 }}>{reviewSuccess}</p>}

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {editingReview ? (
                      <>
                        <button type="button" className="btn" onClick={cancelEditReview}
                          style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', fontSize: 13 }}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn btnPrimary" disabled={reviewLoading}>
                          {reviewLoading ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btnPrimary" disabled title="Editá tu reseña con el lápiz ✏️"
                        style={{ opacity: 0.45, cursor: 'not-allowed' }}>
                        Reseña publicada
                      </button>
                    )}
                  </div>
                </form>
              )
            ) : (
              <div className="reviewLoginPrompt">
                <span style={{ fontSize: 36 }}>🔐</span>
                <p>Para dejar una reseña necesitás estar registrado.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/login" className="btn btnPrimary">Iniciar sesión</Link>
                  <Link to="/registro" className="btn" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}>Registrate</Link>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  )
}
