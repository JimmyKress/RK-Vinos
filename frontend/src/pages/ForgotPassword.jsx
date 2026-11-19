import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { requestPasswordReset } from '../api/axiosDrinks.js'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Por favor ingresá tu email')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await requestPasswordReset(email)
      
      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.mensaje || 'Error al solicitar recuperación')
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
      console.error('Error al solicitar recuperación:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container authPage">
        <Reveal as="section" className="card authCard">
          <div style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              ✓
            </div>
            <h2 style={{ marginBottom: '12px', color: 'var(--text)' }}>
              Email enviado
            </h2>
            <p className="muted" style={{ fontSize: '15px', lineHeight: '1.6' }}>
              Te enviamos un enlace para restablecer tu contraseña a <strong>{email}</strong>.
              <br />
              Revisá tu bandeja de entrada y spam.
            </p>
            <button
              className="btn btnPrimary"
              onClick={() => navigate('/login')}
              style={{ marginTop: '24px' }}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </Reveal>
      </div>
    )
  }

  return (
    <div className="container authPage">
      <Reveal as="section" className="card authCard">
        <div className="authHeader">
          <h1>Recuperar contraseña</h1>
          <p className="muted">
            Ingresá tu email y te enviaremos un código para restablecer tu contraseña.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            background: '#fee',
            color: '#e74c3c',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        <form className="authForm" onSubmit={onSubmit}>
          <label>
            Email
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Ej.: correo@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              required
            />
          </label>

          <button 
            className="btn btnPrimary" 
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>

        <div className="authFooter muted">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </Reveal>
    </div>
  )
}
