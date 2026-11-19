import React, { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: '¿ES NECESARIO REGISTRARME PARA REALIZAR UNA COMPRA?',
      answer: 'Si, para realizar una compra es necesario estar registrado. Tené en cuenta que al registrarte, podes suscribirte a nuestro newsletter, a través del cual se pueden recibir novedades y beneficios exclusivos.'
    },
    {
      question: '¿PUEDO COMPRAR POR UNIDAD?',
      answer: 'Algunos productos pueden comprarse por unidad, otros vienen en cajas con más de una unidad.'
    },
    {
      question: '¿CUÁLES SON LAS FORMAS DE PAGO DISPONIBLES?',
      answer: 'Actualmente, se puede pagar con todas las tarjetas a través de Mercado Pago.'
    },
    {
      question: '¿PUEDO COMPRAR DESDE CUALQUIER PARTE DE ARGENTINA?',
      answer: 'Se hacen envíos a todo el país, excluyendo la provincia de Tierra del Fuego y las localidades de Comodoro Rivadavia y Rada Tilly. Ver más información aquí.'
    },
    {
      question: '¿CUÁLES SON LOS COSTOS Y TIEMPOS DE LOS ENVÍOS?',
      answer: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#5a1f3f' }}>
            SERVICIO DE ENTREGA ENVIO EXPRESS
          </div>
          <div style={{ marginBottom: '8px' }}>
            La entrega se realiza dentro de las 24 horas hábiles de aceptado el pedido. Ver zonas a las que aplica en ENVÍOS.
          </div>
          <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
            Durante eventos (Hot Sale, Cyber Monday, etc) el plazo se extiende hasta 72hs hábiles
          </div>
        </div>
      )
    }
  ]

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0'
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: 'bold',
        margin: '0 0 20px 0',
        color: '#5a1f3f',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '28px' }}>❓</span>
        Preguntas Frecuentes
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: openIndex === index ? '#5a1f3f' : '#f9f9f9',
                color: openIndex === index ? '#fff' : '#333',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (openIndex !== index) {
                  e.target.style.background = '#e9e9e9'
                }
              }}
              onMouseLeave={(e) => {
                if (openIndex !== index) {
                  e.target.style.background = '#f9f9f9'
                }
              }}
            >
              <span style={{ flex: 1, paddingRight: '12px' }}>{faq.question}</span>
              <span style={{
                fontSize: '20px',
                transition: 'transform 0.3s ease',
                transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                {openIndex === index ? '▼' : '▶'}
              </span>
            </button>

            {openIndex === index && (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#fff',
                  borderTop: '1px solid #e0e0e0',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#555',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                {typeof faq.answer === 'string' ? faq.answer : faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
