import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Truck, Zap } from 'lucide-react'
import { WINE_TYPES, formatPriceARS } from '../data/wines.js'
import { getWineById } from '../lib/wine.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Reveal from '../components/Reveal.jsx'
import { coverSvgDataUri } from '../lib/covers.js'
import { useWines } from '../hooks/useWines.js'
import WineComments from '../components/WineComments.jsx'
import { checkEmail, loginUser, trackWineView } from '../api/axiosDrinks.js'
import WhatsAppDeliveryBanner from '../components/WhatsAppDeliveryBanner.jsx'
import FAQ from '../components/FAQ.jsx'

export default function WineDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const cart = useCart()
  const { user, login } = useAuth()
  const [qty, setQty] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0, show: false })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginStep, setLoginStep] = useState('email')  // 'email' | 'password'
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const { wines, loading } = useWines()
  const trackedSlugRef = useRef(null) // Para evitar registrar múltiples veces

  const wine = useMemo(() => {
    const found = getWineById(slug, wines)
    // console.log('WineDetail - slug:', slug, 'found wine:', found)
    return found
  }, [slug, wines])

  // Registrar visita cuando se carga el vino (solo una vez por slug)
  useEffect(() => {
    if (wine && slug && trackedSlugRef.current !== slug) {
      trackWineView(slug, wine.name)
      trackedSlugRef.current = slug
    }
  }, [wine, slug])

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="muted">Cargando producto...</div>
      </div>
    )
  }

  if (!wine) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <Reveal as="div" className="card">
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>No encontrado</div>
            <div className="muted" style={{ marginBottom: 14 }}>
              El producto que buscás no existe.
            </div>
            <Link className="btn btnPrimary" to="/catalogo">
              Volver al catálogo
            </Link>
          </div>
        </Reveal>
      </div>
    )
  }

  const cover = wine.image || coverSvgDataUri({
    title: wine.name,
    subtitle: `${wine.varietal} · ${wine.region}`,
    tone: wine.type
  })

  const model = wine.model || `RK-${String(wine.id || '').toUpperCase()}`
  const winery = wine.winery || 'Bodega RK'
  const pairing = Array.isArray(wine.pairing) ? wine.pairing : []
  const stock = Number.isFinite(wine.stock) ? wine.stock : -1
  const year = wine.year || 'N/A'
  const volumeMl = wine.volumeMl || 750
  const region = wine.region || 'N/A'
  const description = wine.description || 'Sin descripción disponible'

  function addMany() {
    const n = Math.max(1, Math.min(50, Number(qty) || 1))
    console.log('=== BOTÓN AGREGAR AL CARRITO ===')
    console.log('wine.id:', wine.id, 'tipo:', typeof wine.id)
    console.log('cantidad seleccionada:', n)
    console.log('cart.addMany existe:', typeof cart.addMany)
    console.log('cart items antes:', cart.items)
    cart.addMany(wine.id, n)
    console.log('cart items después:', cart.items)
  }

  function handleBuyNow() {
    const n = Math.max(1, Math.min(50, Number(qty) || 1))
    console.log('=== BOTÓN COMPRAR AHORA ===')
    console.log('wine.id:', wine.id, 'tipo:', typeof wine.id)
    console.log('cantidad seleccionada:', n)
    cart.addMany(wine.id, n)
    navigate('/carrito')
  }

  function handleDecrement() {
    setQty(prev => Math.max(1, prev - 1))
  }

  function handleIncrement() {
    setQty(prev => Math.min(50, prev + 1))
  }

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y, show: true })
  }

  function handleMouseLeave() {
    setZoomPosition({ x: 0, y: 0, show: false })
  }

  function closeModal() {
    setShowLoginModal(false)
    setLoginStep('email')
    setLoginEmail('')
    setLoginPassword('')
    setLoginError('')
  }

  async function handleContinue(e) {
    e.preventDefault()
    if (!loginEmail.trim()) { setLoginError('Ingresá tu e-mail'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await checkEmail(loginEmail.trim())
      if (res.exists) {
        setLoginStep('password')
      } else {
        setLoginError('No encontramos una cuenta con ese e-mail. ¿Querés crear una?')
      }
    } catch {
      setLoginError('Error al verificar. Intentá de nuevo.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!loginPassword) { setLoginError('Ingresá tu contraseña'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await loginUser(loginEmail.trim(), loginPassword)
      if (res.success) {
        login(res.user)
        closeModal()
        navigate('/carrito')
      } else {
        setLoginError(res.mensaje || 'Contraseña incorrecta. Intentá de nuevo.')
      }
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Contraseña incorrecta. Intentá de nuevo.'
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <>
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="productPage">
          <div className="productLayout">
            <Reveal as="section" className="productGallery card">
              <div className="productGalleryInner">
                <div
                  className="productGalleryMain"
                  style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    className="productGalleryImg"
                    src={cover}
                    alt={wine.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: zoomPosition.show ? 'scale(2)' : 'scale(1)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transition: 'transform 0.2s ease-out'
                    }}
                  />
                </div>
                <div className="productGalleryThumbs">
                  <button type="button" className="productThumb productThumbActive" aria-label="Imagen 1">
                    <img src={cover} alt="" />
                  </button>
                  <button type="button" className="productThumb" aria-label="Imagen 2">
                    <img src={cover} alt="" />
                  </button>
                  <button type="button" className="productThumb" aria-label="Imagen 3">
                    <img src={cover} alt="" />
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal as="section" className="productInfo" delay={80}>
              <div className="productInfoTop">
                <h1 className="productTitle">{wine.name}</h1>
                <div className="productSubtitle">
                  {WINE_TYPES[wine.type] || wine.type} · {year} · {volumeMl}ml
                </div>

                {/* Información de envío y garantía */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(90, 31, 63, 0.08) 0%, rgba(90, 31, 63, 0.03) 100%)',
                  border: '1px solid rgba(90, 31, 63, 0.15)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={16} style={{ color: '#3b82f6' }} />
                      <span style={{ fontWeight: 600, color: 'var(--brand)' }}>Envío gratis</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={16} style={{ color: '#f59e0b' }} />
                      <span>Despacho en 24hs</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(20,20,24,0.7)', lineHeight: 1.5 }}>
                    En stock y listo para la entrega! Tu pedido se despacha dentro de las 24 horas desde nuestro depósito en Tucumán.
                  </div>
                </div>

                {/* Secciones de información del vino */}
                <div style={{ display: 'grid', gap: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bodega</h3>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>{winery}</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Varietal</h3>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>{wine.varietal}</p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Región</h3>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>{region}</p>
                  </div>

                  {pairing.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Maridaje</h3>
                      <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>{pairing.join(' · ')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="productBuy card">
                <div className="productBuyInner">
                  {/* Stock disponible */}
                  {stock > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                        Stock disponible
                      </span>
                    </div>
                  )}
                  <div className="buyPrice">{formatPriceARS((wine.price || 0) * qty)}</div>
                  <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>Envío gratis</div>

                  {/* Banner de coordinación por WhatsApp */}
                  <WhatsAppDeliveryBanner />

                  <div className="qtyRow">
                    <div className="qtyLabel">Cantidad</div>
                    <div className="qtyControls">
                      <button type="button" onClick={handleDecrement} disabled={qty <= 1}>-</button>
                      <input
                        className="qtyInput"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        inputMode="numeric"
                        min={1}
                        max={50}
                      />
                      <button type="button" onClick={handleIncrement} disabled={qty >= 50}>+</button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btnPrimary"
                    onClick={(e) => {
                      console.log('=== CLICK EN BOTÓN AGREGAR AL CARRITO ===')
                      console.log('stock:', stock, 'stock === 0:', stock === 0)
                      console.log('disabled:', e.target.disabled)
                      addMany()
                    }}
                    onMouseDown={(e) => {
                      console.log('=== MOUSE DOWN EN BOTÓN AGREGAR AL CARRITO ===')
                    }}
                    disabled={false}
                  >
                    Agregar al carrito
                  </button>
                  <Link className="btn" to="/carrito" style={{ background: 'var(--brand)', color: '#fff', border: 'none' }}>
                    Ver carrito
                  </Link>
                  <button className="btn" onClick={handleBuyNow} disabled={false}>
                    Comprar ahora
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal as="section" className="productDesc card" delay={140}>
              <div className="productDescInner">
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notas de cata</h3>
                <div className="muted" style={{ lineHeight: 1.8, fontSize: 15 }}>
                  {description}
                </div>
                {wine.notes && wine.notes.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Características</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {wine.notes.map((n) => (
                        <span key={n} style={{
                          background: 'rgba(90, 31, 63, 0.1)',
                          color: 'var(--brand)',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: 13,
                          fontWeight: 600
                        }}>{n}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* ── Pasos para comprar ── */}
            <Reveal as="section" className="card" delay={150}>
              <div style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>¿Cómo comprar?</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>1</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Elegí tus productos</h4>
                      <p style={{ margin: 0, fontSize: 14, color: 'rgba(20,20,24,0.6)' }}>Agregá al carrito los vinos que quieras y revisá tu selección.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>2</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Completá tus datos</h4>
                      <p style={{ margin: 0, fontSize: 14, color: 'rgba(20,20,24,0.6)' }}>Ingresá tus datos de contacto y envío para coordinar la entrega.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>3</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Seleccioná el tipo de entrega</h4>
                      <p style={{ margin: 0, fontSize: 14, color: 'rgba(20,20,24,0.6)' }}>Elegí entre envío a domicilio o retiro en sucursal.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>4</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Elegí tu forma de pago</h4>
                      <p style={{ margin: 0, fontSize: 14, color: 'rgba(20,20,24,0.6)' }}>Tarjetas, Mercado Pago o transferencia bancaria.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>5</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Confirmá y listo</h4>
                      <p style={{ margin: 0, fontSize: 14, color: 'rgba(20,20,24,0.6)' }}>Recibirás un e-mail con el detalle de tu pedido.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ── Preguntas Frecuentes ── */}
            <Reveal as="section" delay={160}>
              <FAQ />
            </Reveal>
          </div>

          {/* ── Comentarios ── */}
          <WineComments slug={slug} />
        </div>
      </div>

      {/* ── Modal login ── */}
      {showLoginModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: 20,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16,
              padding: '48px 40px', maxWidth: 440, width: '100%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
              position: 'relative'
            }}
          >
            {/* Botón cerrar */}
            <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'rgba(20,20,24,0.35)', lineHeight: 1, padding: '4px 8px' }}>×</button>

            {/* ── Paso 1: email ── */}
            {loginStep === 'email' && (
              <form onSubmit={handleContinue}>
                <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1a0a0a', lineHeight: 1.2 }}>
                  Ingresá tu e-mail para iniciar sesión
                </h2>
                <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(20,20,24,0.5)' }}>
                  Necesitás una cuenta para comprar
                </p>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(20,20,24,0.6)', marginBottom: 6 }}>
                  E-mail
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="tu@email.com"
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setLoginError('') }}
                  autoFocus
                  style={{ marginBottom: loginError ? 8 : 14, fontSize: 16 }}
                />
                {loginError && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#e74c3c', fontWeight: 500 }}>{loginError}</p>
                )}

                <button
                  type="submit"
                  className="btn btnPrimary"
                  disabled={loginLoading}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px', marginBottom: 16 }}
                >
                  {loginLoading ? 'Verificando...' : 'Continuar'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <Link to="/registro" style={{ fontSize: 14, fontWeight: 600, color: '#5a1f3f', textDecoration: 'none' }} onClick={closeModal}>
                    Crear cuenta
                  </Link>
                </div>
              </form>
            )}

            {/* ── Paso 2: contraseña ── */}
            {loginStep === 'password' && (
              <form onSubmit={handleLogin}>
                {/* Volver al email */}
                <button
                  type="button"
                  onClick={() => { setLoginStep('email'); setLoginError(''); setLoginPassword('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#5a1f3f', fontWeight: 600, padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ← {loginEmail}
                </button>

                <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1a0a0a', lineHeight: 1.2 }}>
                  Ingresá tu contraseña
                </h2>
                <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(20,20,24,0.5)' }}>
                  Para continuar con tu compra
                </p>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(20,20,24,0.6)', marginBottom: 6 }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Tu contraseña"
                  value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginError('') }}
                  autoFocus
                  style={{ marginBottom: loginError ? 8 : 14, fontSize: 16 }}
                />
                {loginError && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#e74c3c', fontWeight: 500 }}>{loginError}</p>
                )}

                <button
                  type="submit"
                  className="btn btnPrimary"
                  disabled={loginLoading}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px', marginBottom: 16 }}
                >
                  {loginLoading ? 'Ingresando...' : 'Ingresar'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <Link to="/forgot-password" style={{ fontSize: 13, color: '#5a1f3f', textDecoration: 'none' }} onClick={closeModal}>
                    Olvidé mi contraseña
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
