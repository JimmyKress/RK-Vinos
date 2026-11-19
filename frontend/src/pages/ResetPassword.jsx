import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { resetPassword } from '../api/axiosDrinks.js'

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    
    if (!token) {
      setError('Token inválido. Solicita una nueva recuperación de contraseña.')
      return
    }

    if (!form.password.trim() || !form.confirmPassword.trim()) {
      setError('Todos los campos son requeridos')
      return
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await resetPassword(token, form.password)
      
      if (response.success) {
        navigate('/login', { 
          state: { message: '¡Contraseña restablecida! Ya podés iniciar sesión.' },
          replace: true 
        })
      } else {
        setError(response.mensaje || 'Token inválido o expirado')
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
      console.error('Error al restablecer contraseña:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
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
              background: 'linear-gradient(135deg, #e74c3c 0%, #ff6b6b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white'
            }}>
              ✕
            </div>
            <h2 style={{ marginBottom: '12px', color: 'var(--text)' }}>
              Token inválido
            </h2>
            <p className="muted" style={{ fontSize: '15px', lineHeight: '1.6' }}>
              El enlace de recuperación es inválido o ha expirado.
            </p>
            <button
              className="btn btnPrimary"
              onClick={() => navigate('/forgot-password')}
              style={{ marginTop: '24px' }}
            >
              Solicitar nueva recuperación
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
          <h1>Restablecer contraseña</h1>
          <p className="muted">
            Ingresá tu nueva contraseña.
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
            Nueva contraseña
            <div className="inputEyeWrap">
              <input
                className="input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={onChange}
                required
              />
              <button
                type="button"
                className="inputEyeBtn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <label>
            Confirmar contraseña
            <div className="inputEyeWrap">
              <input
                className="input"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repetí tu contraseña"
                value={form.confirmPassword}
                onChange={onChange}
                required
              />
              <button
                type="button"
                className="inputEyeBtn"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
          </label>

          <button 
            className="btn btnPrimary" 
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="authFooter muted">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </Reveal>
    </div>
  )
}
