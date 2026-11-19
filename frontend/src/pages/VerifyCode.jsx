import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'

export default function VerifyCode() {
  const navigate = useNavigate()
  const location = useLocation()
  const { email, fullName, password, phone } = location.state || {}

  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // Redirigir si no hay datos de registro
  useEffect(() => {
    if (!email || !fullName || !password) {
      navigate('/registro')
    }
  }, [email, fullName, password, navigate])

  // Countdown para reenvío
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Focus automático en el primer input
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus()
    }
  }, [])

  function handleChange(index, value) {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus al siguiente input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  function handleKeyDown(index, e) {
    // Backspace: borrar y mover al anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }

    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
    if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    // Verificar que sean 4 dígitos
    if (/^\d{4}$/.test(pastedData)) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs[3].current?.focus()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const fullCode = code.join('')

    if (fullCode.length !== 4) {
      setError('Por favor ingresa el código completo de 4 dígitos')
      return
    }

    setLoading(true)
    setError('')

    const ROUTE_AUTH = import.meta.env.VITE_ROUTE_AUTH || '/auth'

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${ROUTE_AUTH}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          code: fullCode,
          password,
          phone
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        
        // Esperar 2 segundos y redirigir al login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Su registro se ha realizado correctamente. Por favor inicie sesión.' 
            } 
          })
        }, 2000)
      } else {
        setError(data.mensaje || 'Código incorrecto. Intenta nuevamente.')
        // Limpiar código si es incorrecto
        setCode(['', '', '', ''])
        inputRefs[0].current?.focus()
      }
    } catch (error) {
      console.error('Error al verificar código:', error)
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setResending(true)

    const ROUTE_AUTH = import.meta.env.VITE_ROUTE_AUTH || '/auth'

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${ROUTE_AUTH}/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName
        })
      })

      const data = await response.json()

      if (data.success) {
        setCanResend(false)
        setCountdown(60)
        setCode(['', '', '', ''])
        inputRefs[0].current?.focus()
        alert('✓ Nuevo código enviado a tu correo')
      } else {
        setError(data.mensaje || 'Error al reenviar el código')
      }
    } catch (error) {
      console.error('Error al reenviar código:', error)
      setError('Error de conexión al reenviar el código')
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <div className="container authPage">
      <Reveal as="section" className="card authCard" style={{ maxWidth: 480 }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#00c853',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48
            }}>
              ✓
            </div>
            <h2 style={{ margin: '0 0 12px 0', color: '#00c853' }}>
              ¡Registro exitoso!
            </h2>
            <p className="muted">
              Su registro se ha realizado correctamente.
              <br />
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <>
            <div className="authHeader">
              <h1>Verificación de correo</h1>
              <p className="muted">
                Hemos enviado un código de 4 dígitos a<br />
                <strong>{email}</strong>
              </p>
            </div>

            <form className="authForm" onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
                  Código de verificación
                </label>
                <div style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center'
                }}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={loading || success}
                      style={{
                        width: 60,
                        height: 70,
                        fontSize: 32,
                        fontWeight: 700,
                        textAlign: 'center',
                        border: '2px solid',
                        borderColor: error ? '#e74c3c' : digit ? '#667eea' : '#ddd',
                        borderRadius: 8,
                        outline: 'none',
                        transition: 'all 0.2s',
                        backgroundColor: digit ? '#f0f7ff' : 'white'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#667eea'
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = error ? '#e74c3c' : digit ? '#667eea' : '#ddd'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div style={{
                  padding: 12,
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: 6,
                  color: '#e74c3c',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 16,
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <button
                className="btn btnPrimary"
                type="submit"
                disabled={loading || code.join('').length !== 4}
                style={{
                  opacity: loading || code.join('').length !== 4 ? 0.6 : 1,
                  cursor: loading || code.join('').length !== 4 ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verificando...' : 'Verificar código'}
              </button>
            </form>

            <div style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: '1px solid #eee',
              textAlign: 'center'
            }}>
              <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
                ¿No recibiste el código?
              </p>
              {canResend ? (
                <button
                  className="btn"
                  onClick={handleResendCode}
                  disabled={resending}
                  style={{
                    fontSize: 14,
                    padding: '8px 20px'
                  }}
                >
                  {resending ? 'Reenviando...' : '📧 Reenviar código'}
                </button>
              ) : (
                <p style={{
                  color: '#666',
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  Reenviar disponible en {countdown}s
                </p>
              )}
            </div>

            <div className="authFooter muted" style={{ marginTop: 24 }}>
              <button
                onClick={() => navigate('/registro')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 14
                }}
              >
                ← Volver al registro
              </button>
            </div>
          </>
        )}
      </Reveal>
    </div>
  )
}
