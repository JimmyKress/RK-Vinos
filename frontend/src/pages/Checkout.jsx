import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPriceARS } from '../data/wines.js'
import { useWines } from '../hooks/useWines.js'
import { createOrder } from '../api/axiosDrinks.js'
import WhatsAppDeliveryBanner from '../components/WhatsAppDeliveryBanner.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const cart = useCart()
  const { user } = useAuth()
  const { wines } = useWines()

  const [step, setStep] = useState(1) // 1: Datos, 2: Envío, 3: Pago
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false) // pantalla de carga 5s
  const [progress, setProgress] = useState(0)         // 0-100

  // Formulario de datos
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Datos de envío
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    // Método de pago
    paymentMethod: 'mercadopago',
  })

  const lines = useMemo(() => {
    // Busca el vino por id — si hay duplicados de id entre tipos, busca el primero que coincida
    return Object.entries(cart.items)
      .map(([id, qty]) => ({
        wine: wines.find(w => String(w.id) === String(id)),
        qty
      }))
      .filter((l) => Boolean(l.wine))
  }, [cart.items, wines])

  const subtotal = useMemo(() => {
    return lines.reduce((acc, l) => {
      const price = parseFloat(l.wine.price) || 0
      return acc + price * l.qty
    }, 0)
  }, [lines])

  const shippingCost = 0
  const total = subtotal

  // Redirigir si el carrito está vacío
  if (lines.length === 0) {
    navigate('/carrito')
    return null
  }

  function onChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleNextStep() {
    if (step === 1) {
      // Validar datos personales
      if (!formData.fullName || !formData.email || !formData.phone) {
        alert('Por favor completa todos los campos obligatorios')
        return
      }
      setStep(2)
    } else if (step === 2) {
      // Validar dirección de envío
      if (!formData.address || !formData.city || !formData.province || !formData.postalCode) {
        alert('Por favor completa todos los campos de envío')
        return
      }
      setStep(3)
    }
  }

  async function handleFinishOrder() {
    setLoading(true)
    setProcessing(true)
    setProgress(0)

    // Barra de progreso animada durante 5 segundos
    const start = Date.now()
    const duration = 5000
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / duration) * 100, 98)
      setProgress(pct)
      if (elapsed >= duration) clearInterval(interval)
    }, 50)

    try {
      const orderData = {
        user_id:        user?.id || null,
        full_name:      formData.fullName,
        email:          formData.email,
        phone:          formData.phone,
        address:        formData.address,
        city:           formData.city,
        province:       formData.province,
        postal_code:    formData.postalCode,
        notes:          formData.notes,
        payment_method: formData.paymentMethod,
        subtotal,
        shipping_cost:  shippingCost,
        total: subtotal,
        items: lines.map(l => ({
          wineId:   l.wine.id,
          wineName: l.wine.name,
          wineType: l.wine.type,
          winery:   l.wine.winery || '',
          quantity: l.qty,
          price:    parseFloat(l.wine.price) || 0
        }))
      }

      // Esperar los 5 segundos completos antes de enviar
      await new Promise(resolve => setTimeout(resolve, duration))
      clearInterval(interval)
      setProgress(100)

      const response = await createOrder(orderData)

      await new Promise(resolve => setTimeout(resolve, 400))

      // Si hay un link de Mercado Pago, redirigir
      if (response.mpInitPoint) {
        cart.clear()
        window.location.href = response.mpInitPoint
      } else {
        // MP no devolvió un link — no mostrar éxito falso
        setProcessing(false)
        setProgress(0)
        setLoading(false)
        alert('No se pudo conectar con Mercado Pago. Por favor reintentá o contactanos al 3815293658.')
      }

    } catch (error) {
      console.error('Error al procesar la orden:', error)
      clearInterval(interval)
      setProcessing(false)
      setProgress(0)
      setLoading(false)
      alert('Hubo un error al procesar tu pedido. Por favor intenta nuevamente.')
    }
  }

  return (
    <div className="container" style={{ paddingTop: 18 }}>

      {/* ── Pantalla de procesamiento ── */}
      {processing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 32, padding: 40,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Ícono animado */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5a1f3f, #8b1a2a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
            animation: 'processingPulse 1.2s ease-in-out infinite'
          }}>🛒</div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#1a0a0a' }}>
              Procesando tu pedido
            </h2>
            <p style={{ margin: 0, fontSize: 16, color: 'rgba(20,20,24,0.55)' }}>
              Aguardá un momento, por favor...
            </p>
          </div>

          {/* Barra de progreso */}
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{
              width: '100%', height: 8, background: '#f0e8e0',
              borderRadius: 999, overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #5a1f3f, #8b1a2a)',
                borderRadius: 999,
                transition: 'width 0.1s linear'
              }} />
            </div>
            <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 13, color: 'rgba(20,20,24,0.4)' }}>
              {progress < 40 ? 'Verificando datos...'
                : progress < 75 ? 'Confirmando disponibilidad...'
                : progress < 95 ? 'Registrando tu pedido...'
                : '¡Listo!'}
            </p>
          </div>
        </div>
      )}

      <h1 style={{ margin: '0 0 20px', fontSize: 28, fontWeight: 800 }}>Finalizar Compra</h1>

      {/* Indicador de pasos */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {[
          { num: 1, label: 'Datos Personales' },
          { num: 2, label: 'Envío' },
          { num: 3, label: 'Pago' }
        ].map(s => (
          <div key={s.num} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '12px',
            background: step >= s.num ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
            color: step >= s.num ? 'white' : '#999',
            fontWeight: 700,
            fontSize: '14px',
            transition: 'all 0.3s'
          }}>
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step >= s.num ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {step > s.num ? '✓' : s.num}
            </span>
            {s.label}
          </div>
        ))}
      </div>

      <div className="twoCol" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Formulario principal */}
        <div className="card" style={{ padding: '32px' }}>
          {/* Paso 1: Datos Personales */}
          {step === 1 && (
            <div style={{ display: 'grid', gap: '20px' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>1. Datos Personales</h2>
              
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Nombre completo *</span>
                <input
                  className="input"
                  name="fullName"
                  value={formData.fullName}
                  onChange={onChange}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Email *</span>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Teléfono *</span>
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={onChange}
                  placeholder="11 2345 6789"
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={() => navigate('/carrito')}
                  style={{ flex: 1 }}
                >
                  ← Volver al carrito
                </button>
                <button
                  className="btn btnPrimary"
                  onClick={handleNextStep}
                  style={{ flex: 1 }}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Dirección de Envío */}
          {step === 2 && (
            <div style={{ display: 'grid', gap: '20px' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>2. Dirección de Envío</h2>
              
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Dirección *</span>
                <input
                  className="input"
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  placeholder="Calle y número"
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Ciudad *</span>
                  <input
                    className="input"
                    name="city"
                    value={formData.city}
                    onChange={onChange}
                    placeholder="Ej: Buenos Aires"
                    required
                  />
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Provincia *</span>
                  <input
                    className="input"
                    name="province"
                    value={formData.province}
                    onChange={onChange}
                    placeholder="Ej: Buenos Aires"
                    required
                  />
                </label>
              </div>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Código Postal *</span>
                <input
                  className="input"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={onChange}
                  placeholder="Ej: 1425"
                  required
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notas adicionales (opcional)</span>
                <textarea
                  className="input"
                  name="notes"
                  value={formData.notes}
                  onChange={onChange}
                  placeholder="Ej: Timbre, piso, referencias..."
                  rows={3}
                />
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={() => setStep(1)}
                  style={{ flex: 1 }}
                >
                  ← Anterior
                </button>
                <button
                  className="btn btnPrimary"
                  onClick={handleNextStep}
                  style={{ flex: 1 }}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Método de Pago */}
          {step === 3 && (
            <div style={{ display: 'grid', gap: '20px' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>3. Método de Pago</h2>

              <div style={{
                background: '#f0f8ff',
                padding: 16,
                borderRadius: 12,
                border: '2px solid #667eea',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: '#009ee3',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 800
                }}>
                  MP
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>Mercado Pago</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Tarjetas de crédito, débito y dinero en cuenta</div>
                </div>
              </div>

              <div style={{
                background: '#fff3cd',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ffc107',
                fontSize: 13,
                color: '#856404'
              }}>
                ℹ️ Por el momento, solo aceptamos pagos a través de Mercado Pago.
              </div>

              <div style={{
                background: '#f9f9f9',
                padding: 16,
                borderRadius: 8,
                border: '2px solid #eee'
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>📋 Resumen del Pedido</div>
                <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Productos ({cart.count})</span>
                    <span>{formatPriceARS(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Envío</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Envío gratis</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTop: '2px solid #ddd',
                    marginTop: 8,
                    fontWeight: 700,
                    fontSize: 18
                  }}>
                    <span>Total</span>
                    <span style={{ color: '#667eea' }}>{formatPriceARS(subtotal)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={() => setStep(2)}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  ← Anterior
                </button>
                <button
                  className="btn btnPrimary"
                  onClick={handleFinishOrder}
                  style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  {loading ? '🔄 Procesando...' : '💳 Pagar con Mercado Pago'}
                </button>
              </div>

              {/* Banner de coordinación por WhatsApp antes de pagar */}
              <WhatsAppDeliveryBanner />

              <p style={{ fontSize: 12, color: '#999', textAlign: 'center', margin: '8px 0 0' }}>
                Al finalizar tu compra aceptas nuestros términos y condiciones
              </p>
            </div>
          )}
        </div>

        {/* Resumen lateral */}
        <aside className="card" style={{ padding: '24px', position: 'sticky', top: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Tu Pedido</h3>
          
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            {lines.map(l => (
              <div key={l.wine.id} style={{
                padding: 12,
                background: '#f9f9f9',
                borderRadius: 8,
                fontSize: 13
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{l.wine.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                  <span>Cantidad: {l.qty}</span>
                  <span style={{ fontWeight: 700, color: '#333' }}>
                    {formatPriceARS((parseFloat(l.wine.price) || 0) * l.qty)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 16
          }}>
            <span>Total</span>
            <span style={{ color: '#667eea' }}>{formatPriceARS(total)}</span>
          </div>

          <div style={{
            padding: 12,
            background: '#e8f5e9',
            borderRadius: 8,
            fontSize: 13,
            color: '#2e7d32'
          }}>
            ✓ Compra protegida
          </div>
        </aside>
      </div>
    </div>
  )
}
