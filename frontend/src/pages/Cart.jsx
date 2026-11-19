import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPriceARS } from '../data/wines.js'
import { useWines } from '../hooks/useWines.js'
import { slugify } from '../lib/wine.js'
import WhatsAppDeliveryBanner from '../components/WhatsAppDeliveryBanner.jsx'

export default function Cart() {
  const cart = useCart()
  const { wines } = useWines()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showLoginWarning, setShowLoginWarning] = useState(false)

  const handleCheckout = () => {
    if (!user) {
      setShowLoginWarning(true)
    } else {
      navigate('/checkout')
    }
  }

  const lines = useMemo(() => {
    return Object.entries(cart.items)
      .map(([id, qty]) => ({
        wine: wines.find(w => String(w.id) === String(id)),
        qty
      }))
      .filter((l) => Boolean(l.wine))
  }, [cart.items, wines])

  const total = useMemo(() => {
    return lines.reduce((acc, l) => {
      const price = parseFloat(l.wine.price) || 0
      return acc + price * l.qty
    }, 0)
  }, [lines])

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <h1 style={{ margin: '0 0 10px', fontSize: 22 }}>Carrito</h1>

      {lines.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="muted" style={{ marginBottom: 14 }}>
            Tu carrito está vacío.
          </div>
          <Link className="btn btnPrimary" to="/catalogo">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="twoCol">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {lines.map((l) => (
                <div
                  key={l.wine.id}
                  style={{
                    display: 'grid',
                    gap: 10,
                    padding: 12,
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{l.wine.name}</div>
                      <div className="muted">{l.wine.varietal}</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>{formatPriceARS((parseFloat(l.wine.price) || 0) * l.qty)}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => cart.removeOne(l.wine.id)}>
                      -
                    </button>
                    <div className="badge">Cantidad: {l.qty}</div>
                    <button className="btn" onClick={() => cart.add(l.wine.id)}>
                      +
                    </button>
                    <button className="btn" onClick={() => cart.removeAll(l.wine.id)}>
                      Quitar
                    </button>
                  </div>

                  <Link className="btn" to={`/vino/${slugify(l.wine.name)}`}>
                    Ver detalle
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <aside className="card" style={{ padding: 16, height: 'fit-content' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Resumen</div>
              <div className="muted">Productos: {cart.count}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Envío:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Envío gratis</span>
              </div>
              <div className="price">Total: {formatPriceARS(total)}</div>

              {/* Banner de coordinación por WhatsApp */}
              <WhatsAppDeliveryBanner />

              {showLoginWarning && (
                <div style={{
                  padding: '12px',
                  marginBottom: '12px',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#856404'
                }}>
                  ⚠️ Debes iniciar sesión para finalizar tu compra
                  <div style={{ marginTop: '8px' }}>
                    <Link
                      to="/login"
                      onClick={() => setShowLoginWarning(false)}
                      style={{
                        color: '#856404',
                        textDecoration: 'underline',
                        fontWeight: '700'
                      }}
                    >
                      Iniciar sesión ahora
                    </Link>
                  </div>
                </div>
              )}

              <button
                className="btn btnPrimary"
                onClick={handleCheckout}
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '14px 20px',
                  marginTop: '8px'
                }}
              >
                🛒 Finalizar Compra
              </button>

              <Link className="btn" to="/catalogo">
                Seguir comprando
              </Link>

              <button className="btn" onClick={() => cart.clear()}>
                Vaciar carrito
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
