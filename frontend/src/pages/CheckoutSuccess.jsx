import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function CheckoutSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cart = useCart()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    const preferenceId = searchParams.get('preference_id')
    const externalReference = searchParams.get('external_reference')

    console.log('Pago exitoso:', { paymentId, preferenceId, externalReference })

    // Vaciar el carrito inmediatamente al cargar la página
    cart.clear()

    // Aquí podrías hacer una llamada al backend para actualizar el estado del pedido
    // con el payment_id de Mercado Pago

    setTimeout(() => {
      setLoading(false)
      navigate('/', { state: { orderSuccess: true, message: '¡Pago realizado con éxito! Felicidades, tu pedido ha sido confirmado. Para más detalles revisá tu correo con los detalles de tu pedido, o podés comunicarte al 3815293658.' } })
    }, 2000)
  }, [searchParams, navigate, cart])

  return (
    <div className="container" style={{ paddingTop: 40, textAlign: 'center' }}>
      {loading ? (
        <div>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00c853, #00e676)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, margin: '0 auto 24px', animation: 'processingPulse 1.2s ease-in-out infinite'
          }}>✓</div>
          <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800, color: '#1a0a0a' }}>
            Procesando tu pago...
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(20,20,24,0.55)' }}>
            Aguardá un momento, por favor...
          </p>
        </div>
      ) : (
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800, color: '#00c853' }}>
            ¡Pago realizado con éxito!
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(20,20,24,0.55)' }}>
            Redirigiendo a la página principal...
          </p>
        </div>
      )}
    </div>
  )
}
