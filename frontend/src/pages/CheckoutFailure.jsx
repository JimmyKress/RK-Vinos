import React from 'react'
import { Link } from 'react-router-dom'

export default function CheckoutFailure() {
  return (
    <div className="container" style={{ paddingTop: 40, textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #f44336, #e53935)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, margin: '0 auto 24px'
      }}>✗</div>
      <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800, color: '#1a0a0a' }}>
        Hubo un error con el pago
      </h2>
      <p style={{ fontSize: 16, color: 'rgba(20,20,24,0.55)', marginBottom: 24 }}>
        El pago no pudo ser procesado. Por favor intenta nuevamente o utiliza otro método de pago.
      </p>
      <Link to="/carrito" className="btn btnPrimary">
        Volver al carrito
      </Link>
    </div>
  )
}
