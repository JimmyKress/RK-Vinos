import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { loginUser } from '../api/axiosDrinks.js'

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

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const successMessage = location.state?.message

  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(!!successMessage)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (successMessage) {
      // Ocultar mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    
    if (!form.email.trim() || !form.password.trim()) {
      setError('Email y contraseña son requeridos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await loginUser(form.email, form.password)
      
      if (response.success) {
        login(response.user)
        navigate('/', { replace: true })
      } else {
        setError(response.mensaje || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
      console.error('Error en el inicio de sesión:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container authPage">
      <Reveal as="section" className="card authCard">
        {showSuccessMessage && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
            color: 'white',
            borderRadius: '8px',
            fontWeight: '600',
            textAlign: 'center',
            fontSize: '15px',
            boxShadow: '0 4px 12px rgba(0, 200, 83, 0.3)',
            animation: 'slideInDown 0.5s ease-out'
          }}>
            ✓ {successMessage}
          </div>
        )}

        <div className="authHeader">
          <h1>Iniciar sesión</h1>
          <p className="muted">Ingresá con tu email y contraseña.</p>
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
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Contraseña
            <div className="inputEyeWrap">
              <input
                className="input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
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

          <button 
            className="btn btnPrimary" 
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '16px',
          marginBottom: '16px'
        }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              color: 'var(--brand)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="authFooter muted">
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
        </div>
      </Reveal>
    </div>
  )
}
