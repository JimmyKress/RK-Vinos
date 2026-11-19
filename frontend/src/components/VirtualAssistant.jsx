import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(true)
  const [messages, setMessages] = useState([
    { type: 'assistant', text: '¡Hola! 👋 Soy el asistente de RKvinos. Seleccioná una opción para comenzar.' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const scrollToBottom = () => {
    const el = messagesEndRef.current
    if (el) {
      el.parentElement.scrollTop = el.parentElement.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Categorías de acciones ordenadas
  const categories = [
    {
      label: 'Explorar',
      items: [
        { icon: '📖', text: 'Ver catálogo',    action: () => navigate('/catalogo') },
        { icon: '🍷', text: 'Vinos tintos',    action: () => navigate('/categoria/tinto') },
        { icon: '🥂', text: 'Vinos blancos',   action: () => navigate('/categoria/blanco') },
        { icon: '🌸', text: 'Espumantes',      action: () => navigate('/categoria/espumante') },
      ]
    },
    {
      label: 'Comprar',
      items: [
        { icon: '🛒', text: 'Mi carrito',      action: () => navigate('/carrito') },
        { icon: '👤', text: 'Mi cuenta',       action: () => navigate('/login') },
        { icon: '📝', text: 'Registrarse',     action: () => navigate('/registro') },
      ]
    },
    {
      label: 'Información',
      items: [
        { icon: '💳', text: 'Formas de pago',  action: null, response: '💳 Aceptamos Mercado Pago con tarjetas de crédito y débito. El envío es gratis en todos los pedidos.' },
        { icon: '📦', text: 'Envíos',          action: null, response: '📦 Enviamos a todo Argentina (excepto Tierra del Fuego, Comodoro Rivadavia y Rada Tilly). Entrega en 24 hs hábiles. Envío GRATIS.' },
        { icon: '🏭', text: 'Bodegas',         action: null, response: 'Trabajamos con: Amalaya, Bianchi, Bousquet, Catena Zapata, Jorge Rubio, La Rural, Lamadrid, Luigi Bosca, Trapiche, Viña Las Perdices, Chandon, Doña Paula, Norton y Santa Julia.' },
        { icon: '❓', text: 'Preguntas frecuentes', action: () => navigate('/faq') },
      ]
    }
  ]

  const handleAction = (item) => {
    setMessages(prev => [...prev, { type: 'user', text: item.text }])
    setIsTyping(true)

    setTimeout(() => {
      if (item.response) {
        // Solo texto informativo, sin navegación
        setMessages(prev => [...prev, { type: 'assistant', text: item.response }])
      } else if (item.action) {
        // Texto + botón para que el usuario decida si ir o no
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: `¿Querés ir a ${item.text}?`,
          action: item.action,
          actionLabel: item.text
        }])
      }
      setIsTyping(false)
    }, 400)
  }

  return (
    <>
      {/* Botón para abrir */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="headerActionIcon virtualAssistantBtn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px'
          }}
          title="Asistente virtual"
        >
          💬
        </button>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '72px',
          right: '20px',
          width: 340,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 90px)',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'chatSlideIn 0.25s ease-out'
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #5a1f3f 0%, #7d2b55 100%)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}>🤖</div>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>Asistente RKvinos</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>● En línea</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: '#fff',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div style={{
            overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: '#f6f7f9',
            maxHeight: 180
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  background: msg.type === 'user' ? '#5a1f3f' : '#fff',
                  color: msg.type === 'user' ? '#fff' : '#1a1a1a',
                  padding: '9px 13px',
                  borderRadius: msg.type === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  maxWidth: '88%',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                  {msg.action && (
                    <button
                      type="button"
                      onClick={() => { msg.action(); setIsOpen(false) }}
                      style={{
                        display: 'block',
                        marginTop: 8,
                        background: 'linear-gradient(135deg, #5a1f3f, #7d2b55)',
                        border: 'none',
                        color: '#fff',
                        padding: '7px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center',
                        transition: 'opacity 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Ir a {msg.actionLabel} →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: '#fff',
                  padding: '9px 14px',
                  borderRadius: '14px 14px 14px 3px',
                  fontSize: 13,
                  color: '#999',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  letterSpacing: 2
                }}>
                  ···
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Opciones por categoría */}
          <div style={{
            background: '#fff',
            borderTop: '1px solid #eee',
            flexShrink: 0
          }}>
            {/* Barra de título con toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderBottom: menuOpen ? '1px solid #f0f0f0' : 'none'
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#aaa'
              }}>
                Opciones
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(prev => !prev)}
                style={{
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: 6,
                  width: 22,
                  height: 22,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: '#666',
                  transition: 'background 0.15s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
                title={menuOpen ? 'Minimizar opciones' : 'Mostrar opciones'}
              >
                {menuOpen ? '▾' : '▴'}
              </button>
            </div>

            {/* Grid de opciones colapsable */}
            {menuOpen && (
              <div style={{
                overflowY: 'auto',
                padding: '8px 14px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 260
              }}>
                {categories.map((cat) => (
                  <div key={cat.label}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#aaa',
                      marginBottom: 6
                    }}>
                      {cat.label}
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 6
                    }}>
                      {cat.items.map((item) => (
                        <button
                          key={item.text}
                          type="button"
                          onClick={() => handleAction(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            background: '#f6f7f9',
                            border: '1px solid #ececec',
                            borderRadius: 10,
                            padding: '8px 10px',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#3a1a2e',
                            textAlign: 'left',
                            transition: 'background 0.15s, border-color 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(90,31,63,0.07)'
                            e.currentTarget.style.borderColor = 'rgba(90,31,63,0.25)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f6f7f9'
                            e.currentTarget.style.borderColor = '#ececec'
                          }}
                        >
                          <span style={{ fontSize: 15 }}>{item.icon}</span>
                          <span style={{ lineHeight: 1.3 }}>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
    </>
  )
}
