import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { resetAdminPassword } from '../api/axiosDrinks.js'

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

export default function AdminResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const emailFromState = location.state?.email || ''

  const [form, setForm] = useState({
    email: emailFromState,
    code: '',
    newPassword: '',
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
    
    if (!form.email.trim() || !form.code.trim() || !form.newPassword.trim()) {
      setError('Todos los campos son requeridos')
      return
    }

    if (form.code.length !== 6) {
      setError('El código debe tener 6 dígitos')
      return
    }

    if (form.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await resetAdminPassword(form.email, form.code, form.newPassword)
      
      if (response.success) {
        navigate('/admin', { 
          state: { message: '¡Contraseña restablecida! Ya podés iniciar sesión.' },
          replace: true 
        })
      } else {
        setError(response.mensaje || 'Código inválido o expirado')
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
      console.error('Error al restablecer contraseña:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container authPage">
      <Reveal as="section" className="card authCard">
        <div className="authHeader">
          <h1>Restablecer contraseña - Admin</h1>
          <p className="muted">
            Ingresá el código de 6 dígitos que te enviamos por email y tu nueva contraseña.
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
            Email de administrador
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Ej.: admin@ejemplo.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Código de verificación
            <input
              className="input"
              name="code"
              type="text"
              placeholder="Ingresá el código de 6 dígitos"
              value={form.code}
              onChange={onChange}
              maxLength={6}
              pattern="[0-9]{6}"
              required
              style={{ 
                fontSize: '18px', 
                letterSpacing: '4px',
                textAlign: 'center',
                fontWeight: '600'
              }}
            />
          </label>

          <label>
            Nueva contraseña
            <div className="inputEyeWrap">
              <input
                className="input"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.newPassword}
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
          ¿No recibiste el código? <Link to="/admin/forgot-password">Reenviar</Link>
          {' · '}
          <Link to="/admin">Volver al panel de admin</Link>
        </div>
      </Reveal>
    </div>
  )
}
