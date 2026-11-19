import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { updateUserProfile } from '../api/axiosDrinks.js'

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

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
    profile_picture: user?.profile_picture || ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setMessage('')
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm((current) => ({ ...current, profile_picture: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()

    if (form.password && form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.password && form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const updateData = {
        full_name: form.full_name,
        phone: form.phone,
        profile_picture: form.profile_picture
      }

      if (form.password) {
        updateData.password = form.password
      }

      const response = await updateUserProfile(user.id, updateData)

      if (response.success) {
        updateUser(response.user)
        setMessage('Perfil actualizado exitosamente')
        setForm((current) => ({ ...current, password: '', confirmPassword: '' }))
      } else {
        setError(response.mensaje || 'Error al actualizar perfil')
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
      console.error('Error al actualizar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container authPage">
      <Reveal as="section" className="card authCard">
        <div className="authHeader">
          <h1>Editar perfil</h1>
          <p className="muted">Actualizá tu información personal</p>
        </div>

        {message && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            background: '#efe',
            color: '#00c853',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

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
          {/* Foto de perfil */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: form.profile_picture 
                  ? `url(${form.profile_picture}) center/cover` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '36px',
                marginBottom: '12px',
                border: '3px solid var(--line)'
              }}
            >
              {!form.profile_picture && (form.full_name ? form.full_name.charAt(0).toUpperCase() : 'U')}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              id="profilePicture"
            />
            <label
              htmlFor="profilePicture"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cambiar foto
            </label>
          </div>

          <label>
            Nombre completo <span className="muted">(opcional)</span>
            <input
              className="input"
              name="full_name"
              placeholder="Ej.: Juan Pérez"
              value={form.full_name}
              onChange={onChange}
            />
          </label>

          <label>
            Teléfono <span className="muted">(opcional)</span>
            <input
              className="input"
              name="phone"
              inputMode="tel"
              placeholder="Ej.: 1123445567"
              value={form.phone}
              onChange={onChange}
            />
          </label>

          <label>
            Nueva contraseña <span className="muted">(dejar en blanco para mantener la actual)</span>
            <div className="inputEyeWrap">
              <input
                className="input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={form.password}
                onChange={onChange}
              />
              <button
                type="button"
                className="inputEyeBtn"
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          {form.password && (
            <label>
              Confirmar nueva contraseña
              <div className="inputEyeWrap">
                <input
                  className="input"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmá tu contraseña"
                  value={form.confirmPassword}
                  onChange={onChange}
                />
                <button
                  type="button"
                  className="inputEyeBtn"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </label>
          )}

          <button
            className="btn btnPrimary"
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => navigate('/')}
            style={{ marginTop: '8px' }}
          >
            Cancelar
          </button>
        </form>
      </Reveal>
    </div>
  )
}
