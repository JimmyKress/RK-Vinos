import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import axios from 'axios'

const API_URL = 'http://localhost:3000'

export default function PilotFeedbackPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ margin: '0 0 15px 0', color: '#5a1f3f', fontSize: '24px' }}>
            Inicia sesión para enviar feedback
          </h2>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
            Necesitas tener una cuenta para enviar tu opinión sobre la fase piloto.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 28px',
              background: '#5a1f3f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 28px',
              background: '#fff',
              color: '#5a1f3f',
              border: '2px solid #5a1f3f',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post(`${API_URL}/pilot-feedback`, {
        user_id: user.id,
        feedback: feedback
      })
      setSubmitted(true)
      setFeedback('')
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al enviar feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#5a1f3f',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Volver a la tienda
        </button>

        {!submitted ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '64px', marginBottom: '15px' }}>🚀</div>
              <h1 style={{ margin: '0 0 10px 0', color: '#5a1f3f', fontSize: '28px' }}>
                Fase Piloto
              </h1>
              <p style={{ margin: '0', color: '#666', fontSize: '15px', lineHeight: '1.6' }}>
                Tu opinión nos ayuda a construir una mejor experiencia
              </p>
            </div>

            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '30px', fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
              <strong>ℹ️ Información importante:</strong><br />
              Esta plataforma se encuentra en etapa de prueba. Es posible que encuentres algunos errores o funcionalidades en desarrollo. Tu experiencia nos ayuda a mejorar continuamente.
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>
                  ¿Qué podemos mejorar?
                </label>
                <textarea
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#5a1f3f'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="Cuéntanos qué podemos mejorar, qué te gustó o qué encontraste confuso..."
                />
              </div>

              {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#5a1f3f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar mi opinión'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '60px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ margin: '0 0 15px 0', color: '#5a1f3f', fontSize: '26px' }}>
              ¡Gracias por tu opinión!
            </h2>
            <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
              Tu feedback ha sido enviado correctamente. Nos ayudará a mejorar la tienda y ofrecerte una mejor experiencia.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '14px 28px',
                background: '#5a1f3f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Volver a la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
