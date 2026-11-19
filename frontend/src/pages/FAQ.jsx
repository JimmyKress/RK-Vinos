import React from 'react'
import FAQ from '../components/FAQ.jsx'

export default function FAQPage() {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <h1 style={{
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#5a1f3f'
      }}>
        Preguntas Frecuentes
      </h1>
      <p style={{
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        maxWidth: 600
      }}>
        Encontrá las respuestas a las preguntas más comunes sobre compras, envíos y pagos.
      </p>
      <FAQ />
    </div>
  )
}
