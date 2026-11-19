import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { submitFeedback, checkFeedbackSent } from '../api/axiosDrinks.js'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 36,
            cursor: 'pointer',
            color: n <= (hovered || value) ? '#f5a623' : '#d1d5db',
            transition: 'color 0.15s',
            userSelect: 'none',
            lineHeight: 1
          }}
        >★</span>
      ))}
    </div>
  )
}

export default function Feedback() {
  const { user } = useAuth()

  const [step, setStep] = useState('form') // 'form' | 'success' | 'already'
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    rating:  0,
    comment: ''
  })

  // Verificar si ya envió feedback
  useEffect(() => {
    const email = user?.email || localStorage.getItem('rk_feedback_email')
    if (!email) { setChecking(false); return }
    checkFeedbackSent(email).then(({ alreadySent }) => {
      if (alreadySent) setStep('already')
      setChecking(false)
    })
  }, [user])

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.trim())   return setError('El email es requerido.')
    if (form.rating === 0)    return setError('Seleccioná una calificación.')
    if (!form.comment.trim()) return setError('Escribí tu opinión.')

    setLoading(true)
    setError('')
    try {
      await submitFeedback({
        user_id: user?.id || null,
        email:   form.email.trim(),
        name:    form.name.trim() || null,
        rating:  form.rating,
        comment: form.comment.trim()
      })
      localStorage.setItem('rk_feedback_email', form.email.trim())
      setStep('success')
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        setStep('already')
      } else {
        setError(err.response?.data?.mensaje || 'Ocurrió un error. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="muted">Verificando...</div>
      </div>
    )
  }

  return (
    <div className="feedbackPage">
      <div className="feedbackCard">

        {/* ── Ya envió ── */}
        {step === 'already' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#1a0a0a' }}>
              ¡Ya recibimos tu opinión!
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: 'rgba(20,20,24,0.6)', lineHeight: 1.6 }}>
              Tu feedback ya fue registrado. Agradecemos tu tiempo y compromiso para ayudarnos a mejorar.
            </p>
            <Link to="/" className="btn btnPrimary" style={{ fontSize: 15, padding: '13px 32px' }}>
              Volver al inicio
            </Link>
          </div>
        )}

        {/* ── Enviado con éxito ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🙌</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#1a0a0a' }}>
              ¡Muchas gracias!
            </h2>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: 'rgba(20,20,24,0.6)', lineHeight: 1.6 }}>
              Tu opinión fue recibida y será revisada por nuestro equipo.
            </p>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(20,20,24,0.45)' }}>
              Tu contribución es fundamental para el desarrollo de esta plataforma.
            </p>
            <Link to="/" className="btn btnPrimary" style={{ fontSize: 15, padding: '13px 32px' }}>
              Volver al inicio
            </Link>
          </div>
        )}

        {/* ── Formulario ── */}
        {step === 'form' && (
          <>
            {/* Encabezado */}
            <div className="feedbackHeader">
              <span className="feedbackBadge">🧪 Fase Piloto</span>
              <h1 className="feedbackTitle">Tu opinión nos ayuda a crecer</h1>
              <p className="feedbackLead">
                <strong>RK Vinos</strong> se encuentra actualmente en su <strong>fase piloto</strong>.
                Estamos trabajando activamente para ofrecerte la mejor experiencia posible, y como
                parte de este proceso, tu perspectiva es invaluable.
              </p>
              <p className="feedbackLead">
                Si encontraste algún error, algo que no funcionó como esperabas, o simplemente
                tenés una idea para mejorar la plataforma, te invitamos a compartirla con nosotros
                de manera respetuosa y constructiva.
              </p>
              <div className="feedbackNote">
                <span style={{ fontSize: 18 }}>🔒</span>
                <span>Tus comentarios son <strong>completamente privados</strong>. Solo el equipo de RK Vinos tendrá acceso a esta información, nunca serán publicados ni compartidos.</span>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="feedbackForm">
              <div className="feedbackRow">
                <label className="feedbackLabel">
                  Tu nombre <span style={{ color: 'rgba(20,20,24,0.4)', fontWeight: 400 }}>(opcional)</span>
                  <input
                    className="input"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Ej: Juan Pérez"
                    disabled={loading}
                  />
                </label>

                <label className="feedbackLabel">
                  Tu email <span style={{ color: '#e74c3c' }}>*</span>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="tu@email.com"
                    disabled={!!user || loading}
                  />
                  {user && (
                    <span style={{ fontSize: 12, color: 'rgba(20,20,24,0.4)', marginTop: 4 }}>
                      Usando tu cuenta registrada
                    </span>
                  )}
                </label>
              </div>

              <label className="feedbackLabel">
                Calificación general <span style={{ color: '#e74c3c' }}>*</span>
                <div style={{ marginTop: 8 }}>
                  <StarPicker value={form.rating} onChange={v => { setForm(f => ({ ...f, rating: v })); setError('') }} />
                  {form.rating > 0 && (
                    <span style={{ fontSize: 13, color: 'rgba(20,20,24,0.5)', marginTop: 6, display: 'block' }}>
                      {['', 'Muy mala', 'Regular', 'Aceptable', 'Buena', 'Excelente'][form.rating]}
                    </span>
                  )}
                </div>
              </label>

              <label className="feedbackLabel">
                Tu opinión <span style={{ color: '#e74c3c' }}>*</span>
                <textarea
                  className="input"
                  name="comment"
                  value={form.comment}
                  onChange={onChange}
                  placeholder="Contanos tu experiencia: ¿qué funcionó bien? ¿qué podríamos mejorar? ¿encontraste algún error?"
                  rows={5}
                  maxLength={1000}
                  disabled={loading}
                  style={{ resize: 'vertical', marginTop: 6 }}
                />
                <span style={{ fontSize: 12, color: 'rgba(20,20,24,0.35)', textAlign: 'right', display: 'block', marginTop: 4 }}>
                  {form.comment.length}/1000
                </span>
              </label>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#e74c3c' }}>
                  {error}
                </div>
              )}

              <div className="feedbackActions">
                <Link to="/" className="btn" style={{ fontSize: 14 }}>Cancelar</Link>
                <button
                  type="submit"
                  className="btn btnPrimary"
                  disabled={loading}
                  style={{ fontSize: 15, padding: '13px 32px' }}
                >
                  {loading ? 'Enviando...' : 'Enviar opinión'}
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'rgba(20,20,24,0.35)', textAlign: 'center', margin: '8px 0 0' }}>
                Solo se permite una opinión por persona. Agradecemos tu honestidad y respeto.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
