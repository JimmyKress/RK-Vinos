import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Truck } from 'lucide-react'
import { wines as winesInit, WINE_TYPES, formatPriceARS } from '../data/wines.js'
import { useWines, useWinesAdmin } from '../hooks/useWines.js'
import { getAllUsers, deleteUser, verifyAdminPanelPassword, registerAdmin, loginAdmin } from '../api/axiosDrinks.js'

const LS_CLIENTS = 'rk_admin_clients'
const LS_WINES   = 'rk_admin_wines'
const LS_CONFIG  = 'rk_admin_config'

const CLIENTS_INIT = [
  { id: 'c001', name: 'María González',  email: 'maria@ejemplo.com',  phone: '1122334455', registeredAt: '2024-11-15', online: true  },
  { id: 'c002', name: 'Carlos Rodríguez',email: 'carlos@ejemplo.com', phone: '1133445566', registeredAt: '2024-12-02', online: false },
  { id: 'c003', name: 'Ana Pérez',        email: 'ana@ejemplo.com',    phone: '1144556677', registeredAt: '2025-01-08', online: true  },
  { id: 'c004', name: 'Diego Fernández', email: 'diego@ejemplo.com',  phone: '1155667788', registeredAt: '2025-02-14', online: false },
  { id: 'c005', name: 'Lucía Torres',    email: 'lucia@ejemplo.com',  phone: '1166778899', registeredAt: '2025-03-21', online: true  },
  { id: 'c006', name: 'Martín López',    email: 'martin@ejemplo.com', phone: '1177889900', registeredAt: '2025-04-05', online: false },
]

const STATS_INIT = {
  'malbec-reserva-001':     { views: 342, purchases: 28 },
  'cabernet-franc-002':     { views: 189, purchases: 14 },
  'pinot-noir-003':         { views: 276, purchases: 22 },
  'chardonnay-barrica-004': { views: 231, purchases: 19 },
  'sauvignon-blanc-005':    { views: 145, purchases: 11 },
  'torrontes-006':          { views: 198, purchases: 16 },
  'brut-nature-007':        { views: 312, purchases: 25 },
  'extra-brut-008':         { views: 167, purchases: 13 },
  'rose-009':               { views: 284, purchases: 23 },
}

export const CONFIG_INIT = {
  header: {
    logo: 'RK',
    subtitle: 'VINOS',
    useLogoImage: false,
    logoImage: ''
  },
  slides: [
    { title: 'Selección Emblemática', subtitle: 'Pedidos personalizados', mediaType: 'image', mediaUrl: '/carrousel1.jpg', mediaFileName: 'carrousel1.jpg', published: true },
    { title: 'Nueva Colección', subtitle: 'Gran Reservas seleccionadas para esta temporada', mediaType: 'image', mediaUrl: '/carousel2.avif', mediaFileName: 'carousel2.avif', published: true },
    { title: 'Espumantes Premium', subtitle: 'Brut · Extra Brut · Nature · Rosados. Perfectos para cada celebración', mediaType: 'image', mediaUrl: '/carousel3.avif', mediaFileName: 'carousel3.avif', published: true },
  ],
  hero: {
    title: 'RK Vinos',
    subtitle: 'OFERTAS VINOS BLANCOS'
  },
  footer: 'RK Vinos. Todos los derechos reservados.',
}

const BAR_COLORS = ['#4f9cf9', '#a78bfa', '#00c48c', '#ff7f5a', '#f9c74f', '#f4a261', '#e9c46a', '#2a9d8f', '#e76f51']

function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }, [key, val])
  return [val, setVal]
}

function IcoDash()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IcoUsers()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcoBox()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IcoChart()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function IcoSettings() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IcoUserPlus() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> }
function IcoLogout()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function IcoEdit()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IcoTrash()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> }
function IcoCheck()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IcoPlus()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }

const NAV = [
  { id: 'dashboard',     label: 'Inicio',           Icon: IcoDash     },
  { id: 'clientes',      label: 'Clientes',             Icon: IcoUsers    },
  { id: 'productos',     label: 'Productos',            Icon: IcoBox      },
  { id: 'ingresar',      label: 'Ingresar productos',   Icon: IcoPlus     },
  { id: 'pedidos',       label: 'Administrar pedidos',  Icon: IcoChart    },
  { id: 'resenas',       label: 'Reseñas',              Icon: IcoChart    },
  { id: 'feedback',      label: 'Feedback Piloto',      Icon: IcoChart    },
  { id: 'estadisticas',  label: 'Estadísticas',         Icon: IcoChart    },
  { id: 'configuracion', label: 'Configuración',        Icon: IcoSettings },
  { id: 'usuarios',      label: 'Gestión de usuarios',  Icon: IcoUserPlus },
]

function PasswordGate({ onAuth }) {
  const [step, setStep] = useState(1) // 1: Panel Password, 2: Registro/Login
  const [showLoginForm, setShowLoginForm] = useState(true) // true: Login, false: Registro
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  // Formulario de registro/login
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dni: '',
    password: ''
  })
  const [showFormPass, setShowFormPass] = useState(false)

  function onChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  async function onSubmitPanelPassword(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await verifyAdminPanelPassword(pass)
      if (response.success) {
        setStep(2)
        setPass('')
      } else {
        setError('Contraseña incorrecta')
        setPass('')
      }
    } catch (err) {
      setError('Contraseña incorrecta')
      setPass('')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitRegister(e) {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.dni || !formData.password) {
      setError('Todos los campos son obligatorios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await registerAdmin(formData.fullName, formData.email, formData.dni, formData.password)
      if (response.success) {
        alert('Registro exitoso. Ahora puedes iniciar sesión.')
        setShowLoginForm(true)
        setFormData({ fullName: '', email: '', dni: '', password: '' })
      } else {
        setError(response.mensaje || 'Error al registrar')
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar. Verifica que tu DNI esté autorizado.')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitLogin(e) {
    e.preventDefault()
    if (!formData.email || !formData.dni || !formData.password) {
      setError('Todos los campos son obligatorios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await loginAdmin(formData.email, formData.dni, formData.password)
      if (response.success) {
        // Guardar admin en sessionStorage
        sessionStorage.setItem('rk_admin', JSON.stringify(response.admin))
        onAuth()
      } else {
        setError(response.mensaje || 'Credenciales incorrectas')
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Credenciales incorrectas. Verifica tu email, DNI y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adminGate">
      <div className="adminGateCard" style={{ maxWidth: step === 2 ? 500 : 400 }}>
        <div className="adminGateLogo">
          <span className="adminGateLogoT">RK</span>
          <span className="adminGateLogoS">ADMIN</span>
        </div>

        {/* PASO 1: Contraseña del panel */}
        {step === 1 && (
          <>
            <p className="muted" style={{ textAlign: 'center', marginBottom: 24, color: 'white'}}>
              Ingresá la contraseña para acceder al panel de administración
            </p>
            <form onSubmit={onSubmitPanelPassword} style={{ display: 'grid', gap: 12 }}>
              <div className="inputEyeWrap">
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  placeholder="Contraseña del panel"
                  value={pass}
                  onChange={e => { setPass(e.target.value); setError('') }}
                  autoFocus
                  disabled={loading}
                />
                <button type="button" className="inputEyeBtn" onClick={() => setShow(v => !v)}>
                  {show
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
              </div>
              {error && <div style={{ color: '#e74c3c', fontSize: 13, fontWeight: 600 }}>{error}</div>}
              <button className="btn btnPrimary" type="submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {/* PASO 2: Registro o Login */}
        {step === 2 && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              <button
                className={`btn ${showLoginForm ? 'btnPrimary' : ''}`}
                onClick={() => { setShowLoginForm(true); setError(''); setFormData({ fullName: '', email: '', dni: '', password: '' }) }}
                style={{ flex: 1 }}
              >
                Iniciar Sesión
              </button>
              <button
                className={`btn ${!showLoginForm ? 'btnPrimary' : ''}`}
                onClick={() => { setShowLoginForm(false); setError(''); setFormData({ fullName: '', email: '', dni: '', password: '' }) }}
                style={{ flex: 1 }}
              >
                Registrarse
              </button>
            </div>

            {/* FORMULARIO DE LOGIN */}
            {showLoginForm ? (
              <form onSubmit={onSubmitLogin} style={{ display: 'grid', gap: 12 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, textAlign: 'center' }}>Iniciar Sesión como Admin</h3>
                
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={onChange}
                  disabled={loading}
                  required
                />

                <input
                  className="input"
                  type="text"
                  name="dni"
                  placeholder="DNI"
                  value={formData.dni}
                  onChange={onChange}
                  disabled={loading}
                  required
                />

                <div className="inputEyeWrap">
                  <input
                    className="input"
                    type={showFormPass ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={onChange}
                    disabled={loading}
                    required
                  />
                  <button type="button" className="inputEyeBtn" onClick={() => setShowFormPass(v => !v)}>
                    {showFormPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    }
                  </button>
                </div>

                {error && <div style={{ color: '#e74c3c', fontSize: 13, fontWeight: 600 }}>{error}</div>}
                
                <button className="btn btnPrimary" type="submit" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Volver
                </button>
              </form>
            ) : (
              /* FORMULARIO DE REGISTRO */
              <form onSubmit={onSubmitRegister} style={{ display: 'grid', gap: 12 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, textAlign: 'center' }}>Registro de Admin</h3>
                
                <input
                  className="input"
                  type="text"
                  name="fullName"
                  placeholder="Nombre completo"
                  value={formData.fullName}
                  onChange={onChange}
                  disabled={loading}
                  required
                />

                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={onChange}
                  disabled={loading}
                  required
                />

                <input
                  className="input"
                  type="text"
                  name="dni"
                  placeholder="DNI (solo autorizados)"
                  value={formData.dni}
                  onChange={onChange}
                  disabled={loading}
                  required
                />

                <div className="inputEyeWrap">
                  <input
                    className="input"
                    type={showFormPass ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={onChange}
                    disabled={loading}
                    required
                  />
                  <button type="button" className="inputEyeBtn" onClick={() => setShowFormPass(v => !v)}>
                    {showFormPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    }
                  </button>
                </div>

                {error && <div style={{ color: '#e74c3c', fontSize: 13, fontWeight: 600 }}>{error}</div>}
                
                <div style={{ fontSize: 12, color: '#666', background: '#f9f9f9', padding: 10, borderRadius: 6 }}>
                  ℹ️ Solo se pueden registrar administradores con DNI autorizado
                </div>

                <button className="btn btnPrimary" type="submit" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Volver
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Sidebar({ section, setSection, onLogout, showMobile, setShowMobile, collapsed, setCollapsed }) {
  return (
    <>
      {/* Overlay para cerrar el sidebar en móvil */}
      {showMobile && (
        <div 
          className="adminSidebarOverlay"
          onClick={() => setShowMobile(false)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 999
          }}
        />
      )}

      <aside className={`adminSidebar ${showMobile ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="adminSidebarLogo" style={{ position: 'relative' }}>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2 }}>RK</div>
          <div style={{ fontSize: 11, letterSpacing: 4, marginTop: 4, textTransform: 'uppercase' }}>Admin Panel</div>

          {/* Botón para colapsar/expandir sidebar */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #8b0000 0%, #a52a2a 50%, #8b0000 100%)',
              border: '1px solid rgba(139, 0, 0, 0.5)',
              cursor: 'pointer',
              fontSize: 14,
              color: '#fff',
              padding: '8px 8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(139, 0, 0, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-50%) scale(1.1)'
              e.target.style.background = 'linear-gradient(135deg, #a52a2a 0%, #b22222 50%, #a52a2a 100%)'
              e.target.style.boxShadow = '0 6px 16px rgba(139, 0, 0, 0.5)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(-50%) scale(1)'
              e.target.style.background = 'linear-gradient(135deg, #8b0000 0%, #a52a2a 50%, #8b0000 100%)'
              e.target.style.boxShadow = '0 4px 12px rgba(139, 0, 0, 0.4)'
            }}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="adminNav">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`adminNavItem${section === id ? ' adminNavActive' : ''}`}
              onClick={() => {
                setSection(id)
                setShowMobile(false) // Cerrar menú al seleccionar en móvil
              }}
              title={collapsed ? label : ''}
            >
              <Icon />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button 
            className="adminNavItem adminNavLogout" 
            onClick={onLogout} 
            style={{ width: '100%' }}
            title={collapsed ? 'Cerrar sesión' : ''}
          >
            <IcoLogout />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

function DashboardSection({ clients, clientsLoading }) {
  const { wines } = useWines()
  const online = clients.filter(c => c.online).length
  const [stats, setStats] = useState({ topPurchased: [], topViewed: [] })

  useEffect(() => {
    import('../api/axiosDrinks.js').then(({ getOrderStats }) =>
      getOrderStats().then(setStats).catch(() => {})
    )
  }, [])

  const topWines = stats.topPurchased.slice(0, 5)
  const maxPurchases = topWines[0]?.total || 1

  // Colores dorados para las barras
  const GOLD_COLORS = ['#d4af37', '#f4d03f', '#e5c04b', '#f5d84f', '#e6b800']

  return (
    <div className="adminSection">
      <h2 className="adminSectionTitle">Panel de <span>Control</span></h2>
      
      {/* Tarjetas de estadísticas */}
      <div className="adminCards">
        {[
          { label: 'Clientes registrados',  value: clientsLoading ? '...' : clients.length, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', Icon: IcoUsers  },
          { label: 'Clientes en línea',     value: clientsLoading ? '...' : online,         color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', Icon: IcoUsers  },
          { label: 'Productos en catálogo', value: wines.length,   color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', Icon: IcoBox    },
          { label: 'Vinos comprados',       value: stats.topPurchased.reduce((s, w) => s + (w.total || 0), 0), color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', Icon: IcoChart },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="adminCard">
            <div className="adminCardIcon" style={{ background: color }}><Icon /></div>
            <div>
              <div className="adminCardValue">{value}</div>
              <div className="adminCardLabel">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección destacada - Ranking de productos */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.2)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 className="adminSubTitle" style={{ margin: 0, fontSize: '18px', color: '#d4af37' }}>
              🏆 Ranking de Productos
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Top 5 vinos más vendidos (pedidos aprobados)
            </p>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(212, 175, 55, 0.15)',
            borderRadius: '20px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#d4af37',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {stats.topPurchased.reduce((s, w) => s + (w.total || 0), 0)} ventas
          </div>
        </div>

        {topWines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
            Sin datos de compras aprobadas todavía.
          </div>
        ) : (
          <div className="adminChartBars">
            {topWines.map((w, i) => (
              <div key={w.wineId || i} className="adminBarRow">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#0d0d0d',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                  }}>
                    {i + 1}
                  </div>
                  <div className="adminBarLabel" title={w.wineName}>{w.wineName}</div>
                </div>
                <div className="adminBarTrack">
                  <div className="adminBarFill" style={{ 
                    width: `${(w.total / maxPurchases) * 100}%`, 
                    background: `linear-gradient(90deg, ${GOLD_COLORS[i]} 0%, ${GOLD_COLORS[(i + 1) % GOLD_COLORS.length]} 100%)`
                  }} />
                </div>
                <div className="adminBarValue" style={{
                  color: '#d4af37',
                  fontWeight: '800',
                  fontSize: '14px'
                }}>{w.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección visual destacada - Vista rápida */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍷</div>
          <h4 style={{
            margin: '0 0 8px',
            fontSize: '16px',
            fontWeight: '700',
            color: '#fff'
          }}>
            Total de Vinos
          </h4>
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#d4af37',
            lineHeight: '1'
          }}>
            {wines.length}
          </div>
          <p style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            En catálogo
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
          <h4 style={{
            margin: '0 0 8px',
            fontSize: '16px',
            fontWeight: '700',
            color: '#fff'
          }}>
            Usuarios Activos
          </h4>
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#d4af37',
            lineHeight: '1'
          }}>
            {online}
          </div>
          <p style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            En línea ahora
          </p>
        </div>
      </div>
    </div>
  )
}

function ClientesSection() {
  const [q, setQ] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null)
  const [clientToDelete, setClientToDelete] = useState(null)

  useEffect(() => {
    loadUsers()
    
    // Auto-refrescar cada 30 segundos para actualizar estado online
    const refreshInterval = setInterval(() => {
      loadUsers()
    }, 30000) // 30 segundos

    return () => clearInterval(refreshInterval)
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')
      const response = await getAllUsers()
      if (response.success) {
        setClients(response.users)
      } else {
        setError('Error al cargar usuarios')
      }
    } catch (err) {
      setError('Error de conexión al servidor')
      console.error('Error al cargar usuarios:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteClient(id) {
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return

    try {
      setDeleting(id)
      const response = await deleteUser(id)
      if (response.success) {
        setClients(prev => prev.filter(c => c.id !== id))
      } else {
        alert('Error al eliminar cliente: ' + response.mensaje)
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      alert('Error de conexión al eliminar cliente')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = useMemo(() => {
    const lq = q.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(lq) || c.email.toLowerCase().includes(lq))
  }, [clients, q])

  if (loading) {
    return (
      <div className="adminSection">
        <h2 className="adminSectionTitle">Clientes registrados</h2>
        <div className="muted">Cargando clientes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="adminSection">
        <h2 className="adminSectionTitle">Clientes registrados</h2>
        <div style={{ color: '#e74c3c', marginBottom: 12 }}>{error}</div>
        <button className="btn btnPrimary" onClick={loadUsers}>Reintentar</button>
      </div>
    )
  }

  return (
    <div className="adminSection">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="adminSectionTitle" style={{ margin: 0 }}>Clientes registrados ({clients.length})</h2>
        <button 
          className="btn btnPrimary" 
          onClick={loadUsers}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
        </button>
      </div>
      <input className="input adminSearch" placeholder="Buscar por nombre o email..." value={q} onChange={e => setQ(e.target.value)} />
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Registrado</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        onClick={() => c.profile_picture && setSelectedProfilePicture(c.profile_picture)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: c.profile_picture 
                            ? `url(${c.profile_picture}) center/cover` 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '16px',
                          cursor: c.profile_picture ? 'pointer' : 'default',
                          flexShrink: 0
                        }}
                      >
                        {!c.profile_picture && (c.name ? c.name.charAt(0).toUpperCase() : 'U')}
                      </div>
                      {c.name}
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.registeredAt}</td>
                  <td><span className={`adminBadge ${c.online ? 'adminBadgeGreen' : 'adminBadgeGray'}`}>{c.online ? 'En línea' : 'Offline'}</span></td>
                  <td>
                    <button 
                      className="adminActionBtn adminActionDelete" 
                      onClick={() => setClientToDelete(c)}
                      disabled={deleting === c.id}
                      style={{ opacity: deleting === c.id ? 0.6 : 1, cursor: deleting === c.id ? 'not-allowed' : 'pointer' }}
                    >
                      <IcoTrash /> {deleting === c.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedProfilePicture && (
        <div
          onClick={() => setSelectedProfilePicture(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <img
              src={selectedProfilePicture}
              alt="Foto de perfil"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
            <button
              onClick={() => setSelectedProfilePicture(null)}
              style={{
                marginTop: '16px',
                padding: '8px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {clientToDelete && (
        <div
          onClick={() => !deleting && setClientToDelete(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideInUp 0.3s ease-out'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>

            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: '700',
              textAlign: 'center',
              color: '#333'
            }}>
              ¿Estás seguro?
            </h3>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              textAlign: 'center',
              color: '#666',
              lineHeight: '1.5'
            }}>
              ¿Deseas eliminar al cliente <strong style={{ color: '#333' }}>{clientToDelete.name}</strong>?
              <br />
              <span style={{ fontSize: '14px', color: '#999' }}>Esta acción no se puede deshacer.</span>
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setClientToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '12px 32px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  opacity: deleting ? 0.6 : 1
                }}
                onMouseOver={(e) => !deleting && (e.target.style.background = '#e0e0e0')}
                onMouseOut={(e) => !deleting && (e.target.style.background = '#f0f0f0')}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteClient(clientToDelete.id)}
                disabled={deleting}
                style={{
                  padding: '12px 32px',
                  background: deleting ? '#ccc' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !deleting && (e.target.style.background = '#c0392b')}
                onMouseOut={(e) => !deleting && (e.target.style.background = '#e74c3c')}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductosSection() {
  const { wines, loading, refetch } = useWinesAdmin()
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [productToDelete, setProductToDelete] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  function startEdit(w) {
    setEditing(w.id)
    setDraft({ 
      id: w.id,
      name: w.name, 
      varietal: w.varietal || w.cepa || '', 
      region: w.region || '', 
      year: w.year || '', 
      price: w.price || '', 
      stock: w.stock ?? '',
      wineType: w.wineType || w.type,    // tipo original (tinto/blanco/espumante) — para saber de qué tabla eliminar
      newWineType: w.wineType || w.type, // tipo nuevo seleccionado por el admin
      type: w.type,                      // campo "categoría" (Reserva, Gran Reserva, etc.)
      winery: w.winery || '',
      volumeMl: w.volumeMl || 750,
      description: w.description || '',
      notes: Array.isArray(w.notes) ? w.notes.join(', ') : (w.notes || ''),
      pairing: Array.isArray(w.pairing) ? w.pairing.join(', ') : (w.pairing || ''),
      image: w.image || '',
      featured: w.featured ? true : false
    })
    setMessage('')
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage('La imagen no debe superar los 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        field('image', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function saveEdit() {
    setSaving(true)
    setMessage('')
    
    try {
      const wineData = {
        id: draft.id,
        name: draft.name,
        type: draft.type,
        cepa: draft.varietal,
        price: draft.price ? parseFloat(String(draft.price).replace(',', '.')) : 0,
        stock: Number(draft.stock) || 0,
        year: Number(draft.year) || null,
        region: draft.region || null,
        winery: draft.winery || null,
        volumeMl: Number(draft.volumeMl) || 750,
        description: draft.description || null,
        notes: draft.notes || null,
        pairing: draft.pairing || null,
        image: draft.image || null,
        featured: draft.featured
      }

      const typeChanged = draft.wineType !== draft.newWineType && draft.newWineType

      if (typeChanged) {
        // 1. Eliminar de la tabla original
        let deleteFunction
        if (draft.wineType === 'tinto') {
          const { deleteRedWine } = await import('../api/axiosDrinks.js')
          deleteFunction = deleteRedWine
        } else if (draft.wineType === 'blanco') {
          const { deleteWhiteWine } = await import('../api/axiosDrinks.js')
          deleteFunction = deleteWhiteWine
        } else {
          const { deleteRoseWine } = await import('../api/axiosDrinks.js')
          deleteFunction = deleteRoseWine
        }
        await deleteFunction(draft.id)

        // 2. Insertar en la tabla nueva (sin id, la DB asigna uno nuevo)
        const { id: _id, ...newWineData } = wineData
        let createFunction
        if (draft.newWineType === 'tinto') {
          const { createRedWine } = await import('../api/axiosDrinks.js')
          createFunction = createRedWine
        } else if (draft.newWineType === 'blanco') {
          const { createWhiteWine } = await import('../api/axiosDrinks.js')
          createFunction = createWhiteWine
        } else {
          const { createRoseWine } = await import('../api/axiosDrinks.js')
          createFunction = createRoseWine
        }
        await createFunction(newWineData)
      } else {
        // Mismo tipo: update normal
        let updateFunction
        if (draft.wineType === 'tinto') {
          const { updateRedWine } = await import('../api/axiosDrinks.js')
          updateFunction = updateRedWine
        } else if (draft.wineType === 'blanco') {
          const { updateWhiteWine } = await import('../api/axiosDrinks.js')
          updateFunction = updateWhiteWine
        } else {
          const { updateRoseWine } = await import('../api/axiosDrinks.js')
          updateFunction = updateRoseWine
        }
        await updateFunction(wineData)
      }

      setMessage('Producto actualizado correctamente')
      setEditing(null)
      refetch()
    } catch (error) {
      setMessage('Error al actualizar: ' + (error.response?.data?.mensaje || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function deleteWine(wine) {
    setProductToDelete(wine)
  }

  async function confirmDeleteWine() {
    if (!productToDelete) return

    setSaving(true)
    setMessage('')

    try {
      let deleteFunction
      if (productToDelete.type === 'tinto') {
        const { deleteRedWine } = await import('../api/axiosDrinks.js')
        deleteFunction = deleteRedWine
      } else if (productToDelete.type === 'blanco') {
        const { deleteWhiteWine } = await import('../api/axiosDrinks.js')
        deleteFunction = deleteWhiteWine
      } else {
        const { deleteRoseWine } = await import('../api/axiosDrinks.js')
        deleteFunction = deleteRoseWine
      }

      await deleteFunction(productToDelete.id)
      setMessage(`"${productToDelete.name}" eliminado correctamente`)
      setProductToDelete(null)
      refetch()
    } catch (error) {
      setMessage('Error al eliminar: ' + (error.response?.data?.mensaje || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function toggleFeatured(wine) {
    setSaving(true)
    setMessage('')

    try {
      const currentFeatured = wine.featured === 1 || wine.featured === true
      const newFeatured = !currentFeatured
      console.log('Toggle featured:', { id: wine.id, name: wine.name, currentFeatured, newFeatured })

      const wineData = {
        id: wine.id,
        name: wine.name,
        type: wine.type,
        cepa: wine.varietal || wine.cepa,
        price: Number(wine.price) || 0,
        stock: Number(wine.stock) || 0,
        year: Number(wine.year) || null,
        region: wine.region || null,
        winery: wine.winery || null,
        volumeMl: Number(wine.volumeMl) || 750,
        description: wine.description || null,
        notes: Array.isArray(wine.notes) ? wine.notes.join(', ') : (wine.notes || null),
        pairing: Array.isArray(wine.pairing) ? wine.pairing.join(', ') : (wine.pairing || null),
        image: wine.image || null,
        featured: newFeatured
      }

      let updateFunction
      if (wine.type === 'tinto') {
        const { updateRedWine } = await import('../api/axiosDrinks.js')
        updateFunction = updateRedWine
      } else if (wine.type === 'blanco') {
        const { updateWhiteWine } = await import('../api/axiosDrinks.js')
        updateFunction = updateWhiteWine
      } else {
        const { updateRoseWine } = await import('../api/axiosDrinks.js')
        updateFunction = updateRoseWine
      }

      await updateFunction(wineData)
      setMessage(`"${wine.name}" actualizado correctamente`)
      refetch()
    } catch (error) {
      console.error('Error en toggleFeatured:', error)
      setMessage('Error al actualizar: ' + (error.response?.data?.mensaje || error.message))
    } finally {
      setSaving(false)
    }
  }

  async function toggleHidden(wine) {
    setSaving(true)
    setMessage('')
    
    try {
      const newHidden = !(wine.hidden === 1)
      let toggleFunction
      
      if (wine.type === 'tinto') {
        const { toggleRedWineHidden } = await import('../api/axiosDrinks.js')
        toggleFunction = toggleRedWineHidden
      } else if (wine.type === 'blanco') {
        const { toggleWhiteWineHidden } = await import('../api/axiosDrinks.js')
        toggleFunction = toggleWhiteWineHidden
      } else {
        const { toggleRoseWineHidden } = await import('../api/axiosDrinks.js')
        toggleFunction = toggleRoseWineHidden
      }

      await toggleFunction(wine.id, newHidden)
      setMessage(`"${wine.name}" ${newHidden ? 'ocultado' : 'visible'} correctamente`)
      refetch()
    } catch (error) {
      setMessage('Error al cambiar visibilidad: ' + (error.response?.data?.mensaje || error.message))
    } finally {
      setSaving(false)
    }
  }

  function field(k, v) { setDraft(d => ({ ...d, [k]: v })); setMessage('') }

  // Filtrar productos según búsqueda
  const filteredWines = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return wines
    
    const query = searchQuery.toLowerCase()
    return wines.filter(w => {
      return (
        w.name?.toLowerCase().includes(query) ||
        w.winery?.toLowerCase().includes(query) ||
        w.bodega?.toLowerCase().includes(query) ||
        w.varietal?.toLowerCase().includes(query) ||
        w.cepa?.toLowerCase().includes(query) ||
        w.region?.toLowerCase().includes(query) ||
        w.type?.toLowerCase().includes(query) ||
        w.wineType?.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, wines])

  if (loading) {
    return (
      <div className="adminSection">
        <h2 className="adminSectionTitle">Gestión de productos</h2>
        <div className="muted">Cargando productos...</div>
      </div>
    )
  }

  return (
    <div className="adminSection">
      <h2 className="adminSectionTitle">Gestión de productos</h2>
      {message && (
        <div style={{ 
          color: message.includes('Error') ? '#e74c3c' : '#00c48c', 
          fontSize: 13, 
          fontWeight: 600,
          padding: 8,
          marginBottom: 12,
          background: message.includes('Error') ? '#fee' : '#efe',
          borderRadius: 6
        }}>
          {message}
        </div>
      )}
      
      {/* Buscador */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Buscar por nombre, bodega, varietal, región, tipo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', maxWidth: 400 }}
        />
        {searchQuery && filteredWines.length === 0 && (
          <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
            No se encontraron productos que coincidan con la búsqueda
          </div>
        )}
      </div>

      <div className="adminTableWrap" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
        <table className="adminTable" style={{ minWidth: '1200px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa' }}><tr><th>Imagen</th><th>Nombre</th><th>Bodega</th><th>Tipo</th><th>Varietal</th><th>Región</th><th>Año</th><th>Precio</th><th>Stock</th><th>Destacado</th><th>Visible</th><th>Acciones</th></tr></thead>
          <tbody>
            {filteredWines.map(w => editing === w.id ? (
              <tr key={`${w.wineType}-${w.id}`} className="adminEditRow">
                <td colSpan="12">
                  <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Editando: {w.name}</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="adminConfigLabel">Tipo de vino</label>
                        <select
                          className="input"
                          value={draft.newWineType}
                          onChange={e => field('newWineType', e.target.value)}
                          disabled={saving}
                        >
                          <option value="tinto">Tinto</option>
                          <option value="blanco">Blanco</option>
                          <option value="espumante">Espumante / Rosé</option>
                        </select>
                        {draft.newWineType !== draft.wineType && (
                          <p style={{ fontSize: 12, color: '#e67e22', marginTop: 4, fontWeight: 600 }}>
                            ⚠ El vino se moverá de la tabla "{draft.wineType}" a "{draft.newWineType}"
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="adminConfigLabel">Nombre</label>
                        <input className="input" value={draft.name} onChange={e => field('name', e.target.value)} disabled={saving} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="adminConfigLabel">Varietal/Cepa</label>
                        <input className="input" value={draft.varietal} onChange={e => field('varietal', e.target.value)} disabled={saving} />
                      </div>
                      <div>
                        <label className="adminConfigLabel">Bodega</label>
                        <input className="input" value={draft.winery} onChange={e => field('winery', e.target.value)} disabled={saving} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="adminConfigLabel">Región</label>
                        <input className="input" value={draft.region} onChange={e => field('region', e.target.value)} disabled={saving} />
                      </div>
                      <div>
                        <label className="adminConfigLabel">Año</label>
                        <input className="input" type="number" min="1900" max="2155" value={draft.year} onChange={e => field('year', e.target.value)} disabled={saving} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="adminConfigLabel">Precio (ARS)</label>
                        <input className="input" type="text" value={draft.price} onChange={e => field('price', e.target.value.replace(',', '.'))} disabled={saving} placeholder="Ej: 18075.71" />
                      </div>
                      <div>
                        <label className="adminConfigLabel">Stock</label>
                        <input className="input" type="number" value={draft.stock} onChange={e => field('stock', e.target.value)} disabled={saving} />
                      </div>
                      <div>
                        <label className="adminConfigLabel">Volumen (ml)</label>
                        <input className="input" type="number" value={draft.volumeMl} onChange={e => field('volumeMl', e.target.value)} disabled={saving} />
                      </div>
                    </div>

                    <div>
                      <label className="adminConfigLabel">Descripción</label>
                      <textarea className="input" rows={3} value={draft.description} onChange={e => field('description', e.target.value)} disabled={saving} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="adminConfigLabel">Notas (separadas por comas)</label>
                        <textarea className="input" rows={2} value={draft.notes} onChange={e => field('notes', e.target.value)} disabled={saving} />
                      </div>
                      <div>
                        <label className="adminConfigLabel">Maridaje (separado por comas)</label>
                        <textarea className="input" rows={2} value={draft.pairing} onChange={e => field('pairing', e.target.value)} disabled={saving} />
                      </div>
                    </div>

                    <div>
                      <label className="adminConfigLabel">Imagen del producto</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={saving}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--line)',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: saving ? 'not-allowed' : 'pointer'
                            }}
                          />
                          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                            Máximo 2MB. Formatos: JPG, PNG, GIF
                          </p>
                        </div>
                        {draft.image && (
                          <div
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '6px',
                              background: `url(${draft.image}) center/cover`,
                              border: '1px solid var(--line)',
                              flexShrink: 0
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input 
                        type="checkbox" 
                        id={`featured-${w.id}`}
                        checked={draft.featured} 
                        onChange={(e) => field('featured', e.target.checked)}
                        disabled={saving}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <label htmlFor={`featured-${w.id}`} style={{ cursor: 'pointer', fontWeight: 600 }}>
                        Mostrar en destacados
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <button className="btn btnPrimary" onClick={saveEdit} disabled={saving}>
                        {saving ? 'Guardando...' : '✓ Guardar cambios'}
                      </button>
                      <button className="btn" onClick={() => setEditing(null)} disabled={saving}>
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={`${w.wineType}-${w.id}`}>
                <td>
                  <div
                    onClick={() => setZoomImage(w.image || null)}
                    title={w.image ? 'Click para ampliar' : 'Sin imagen'}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid var(--line)',
                      background: w.image ? 'transparent' : 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {w.image
                      ? <img src={w.image} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'crisp-edges' }} />
                      : <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>vacío</span>
                    }
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{w.name}</td>
                <td>{w.winery || w.bodega || '—'}</td>
                <td><span className="adminBadge adminBadgeBlue">{WINE_TYPES[w.type] || w.type}</span></td>
                <td>{w.varietal || w.cepa}</td>
                <td>{w.region}</td>
                <td>{w.year}</td>
                <td>{formatPriceARS(w.price)}</td>
                <td>{w.stock ?? '—'}</td>
                <td>
                  <button 
                    className={`adminBadge ${w.featured ? 'adminBadgeGreen' : 'adminBadgeGray'}`}
                    onClick={() => toggleFeatured(w)}
                    disabled={saving}
                    style={{ cursor: 'pointer', border: 'none', padding: '4px 8px' }}
                  >
                    {w.featured ? '⭐ Sí' : 'No'}
                  </button>
                </td>
                <td>
                  <button 
                    className={`adminBadge ${w.hidden === 1 ? 'adminBadgeGray' : 'adminBadgeGreen'}`}
                    onClick={() => toggleHidden(w)}
                    disabled={saving}
                    style={{ cursor: 'pointer', border: 'none', padding: '4px 8px' }}
                  >
                    {w.hidden === 1 ? '👁 Oculto' : '✓ Visible'}
                  </button>
                </td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="adminActionBtn adminActionEdit" onClick={() => startEdit(w)} disabled={saving}>
                    <IcoEdit /> Editar
                  </button>
                  <button className="adminActionBtn adminActionDelete" onClick={() => deleteWine(w)} disabled={saving}>
                    <IcoTrash /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10001, padding: 20, cursor: 'zoom-out'
          }}
        >
          <img
            src={zoomImage}
            alt="Imagen del producto"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              borderRadius: 12, objectFit: 'contain',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              cursor: 'default'
            }}
          />
        </div>
      )}

      {productToDelete && (
        <div
          onClick={() => !saving && setProductToDelete(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideInUp 0.3s ease-out'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>

            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: '700',
              textAlign: 'center',
              color: '#333'
            }}>
              ¿Estás seguro?
            </h3>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              textAlign: 'center',
              color: '#666',
              lineHeight: '1.5'
            }}>
              ¿Deseas eliminar el producto <strong style={{ color: '#333' }}>{productToDelete.name}</strong>?
              <br />
              <span style={{ fontSize: '14px', color: '#999' }}>Esta acción no se puede deshacer.</span>
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setProductToDelete(null)}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.6 : 1
                }}
                onMouseOver={(e) => !saving && (e.target.style.background = '#c0392b')}
                onMouseOut={(e) => !saving && (e.target.style.background = '#e74c3c')}
              >
                Rechazar
              </button>
              <button
                onClick={confirmDeleteWine}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.6 : 1
                }}
                onMouseOver={(e) => !saving && (e.target.style.background = '#229954')}
                onMouseOut={(e) => !saving && (e.target.style.background = '#27ae60')}
              >
                {saving ? 'Eliminando...' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EstadisticasSection({ wines }) {
  const [stats, setStats] = useState({ topPurchased: [], topViewed: [] })
  const [loading, setLoading] = useState(true)
  const [charts, setCharts] = useState({ topViewedChart: null, topPurchasedChart: null, distributionChart: null })
  const [generatingCharts, setGeneratingCharts] = useState(false)

  useEffect(() => {
    import('../api/axiosDrinks.js').then(({ getOrderStats }) =>
      getOrderStats().then(d => { 
        setStats(d); 
        setLoading(false);
        // Generar gráficos automáticamente después de cargar los datos
        if (d.topViewed.length > 0 || d.topPurchased.length > 0) {
          generateChartsWithPython(d);
        }
      }).catch(() => setLoading(false))
    )
  }, [])

  async function generateChartsWithPython(statsData = stats) {
    setGeneratingCharts(true)
    try {
      const { generateCharts } = await import('../api/axiosDrinks.js')
      const response = await generateCharts(statsData)
      if (response.success) {
        setCharts(response.charts)
      }
    } catch (error) {
      console.error('Error al generar gráficos:', error)
    } finally {
      setGeneratingCharts(false)
    }
  }

  return (
    <div className="adminSection">
      <h2 className="adminSectionTitle">Estadísticas</h2>
      
      <button 
        className="btn btnPrimary" 
        onClick={() => generateChartsWithPython()}
        disabled={generatingCharts || loading}
        style={{ marginBottom: 20 }}
      >
        {generatingCharts ? 'Regenerando gráficos...' : '🔄 Regenerar Gráficos'}
      </button>
      
      {loading ? <div className="muted">Cargando estadísticas...</div> : (
        <div className="adminStatsGrid">
          <div>
            <h3 className="adminSubTitle">Más visitados</h3>
            {charts.topViewedChart ? (
              <img 
                src={`http://localhost:3000${charts.topViewedChart}`} 
                alt="Vinos más visitados" 
                style={{ width: '100%', maxWidth: '700px', borderRadius: '8px' }}
              />
            ) : (
              <div className="muted">Sin visitas registradas todavía.</div>
            )}
          </div>
          <div>
            <h3 className="adminSubTitle">Vinos comprados <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>(solo pedidos aprobados)</span></h3>
            {charts.topPurchasedChart ? (
              <img 
                src={`http://localhost:3000${charts.topPurchasedChart}`} 
                alt="Vinos más comprados" 
                style={{ width: '100%', maxWidth: '700px', borderRadius: '8px' }}
              />
            ) : (
              <div className="muted">Sin compras aprobadas todavía.</div>
            )}
          </div>
          {charts.distributionChart && (
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 className="adminSubTitle">Distribución de Ventas</h3>
              <img 
                src={`http://localhost:3000${charts.distributionChart}`} 
                alt="Distribución de ventas" 
                style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: 'block', borderRadius: '8px' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConfiguracionSection() {
  const [config, setConfig] = useLS(LS_CONFIG, CONFIG_INIT)
  const [draft, setDraft]   = useState(() => JSON.parse(JSON.stringify(config)))
  const [saved, setSaved]   = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  // ── helpers de estado ──────────────────────────────────────────────────────
  function onHeader(key, val) {
    setDraft(d => ({ ...d, header: { ...d.header, [key]: val } }))
  }
  function onHero(key, val) {
    setDraft(d => ({ ...d, hero: { ...d.hero, [key]: val } }))
  }
  function onSlide(i, key, val) {
    setDraft(d => ({ ...d, slides: d.slides.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }))
  }
  function addSlide() {
    setDraft(d => ({
      ...d,
      slides: [...d.slides, { title: 'Nuevo Slide', subtitle: 'Descripción', mediaType: 'none', mediaUrl: '', mediaFileName: '', published: false }]
    }))
    setActiveSlide(draft.slides.length)
  }
  function removeSlide(i) {
    if (draft.slides.length <= 1) { alert('Debe haber al menos un slide'); return }
    if (!window.confirm('¿Eliminar este slide?')) return
    setDraft(d => ({ ...d, slides: d.slides.filter((_, idx) => idx !== i) }))
    setActiveSlide(Math.max(0, i - 1))
  }
  function togglePublishSlide(i) {
    setDraft(d => ({ ...d, slides: d.slides.map((s, idx) => idx === i ? { ...s, published: !s.published } : s) }))
  }

  function handleHeaderImageChange(e) {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('La imagen no debe superar los 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => { onHeader('logoImage', reader.result); onHeader('useLogoImage', true) }
    reader.readAsDataURL(file)
  }
  function handleSlideMediaChange(i, e) {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('El archivo no debe superar los 10MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      const isVideo = file.type.startsWith('video/')
      onSlide(i, 'mediaUrl', reader.result)
      onSlide(i, 'mediaType', isVideo ? 'video' : 'image')
      onSlide(i, 'mediaFileName', file.name)
    }
    reader.readAsDataURL(file)
  }

  function save() {
    setConfig(draft)
    window.dispatchEvent(new Event('rk_config_updated'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }
  function reset() {
    if (!window.confirm('¿Restaurar configuración por defecto?')) return
    setDraft(JSON.parse(JSON.stringify(CONFIG_INIT)))
  }

  const s = draft.slides?.[activeSlide] || {}

  // ── estilos compartidos ───────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    overflow: 'hidden'
  }
  const cardHeadStyle = {
    padding: '14px 20px',
    borderBottom: '1px solid var(--line)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.02)'
  }
  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: 5,
    display: 'block'
  }
  const sectionLabel = { fontSize: 13, fontWeight: 800, margin: 0 }

  return (
    <div className="adminSection">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 className="adminSectionTitle" style={{ marginBottom: 4 }}>Configuración de la página</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Cada sección muestra un preview fiel a cómo se verá en la tienda.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={reset}>Restaurar</button>
          <button className="btn btnPrimary" onClick={save} style={{ minWidth: 140 }}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════════════════════════════════════════════════════
            1. ENCABEZADO / LOGO
        ══════════════════════════════════════════════════════════ */}
        <div style={cardStyle}>
          <div style={cardHeadStyle}>
            <span style={sectionLabel}>🏷️ Encabezado / Logo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

            {/* Controles */}
            <div style={{ padding: 20, borderRight: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="radio" name="logoType" checked={!draft.header?.useLogoImage}
                    onChange={() => onHeader('useLogoImage', false)} />
                  Texto
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="radio" name="logoType" checked={!!draft.header?.useLogoImage}
                    onChange={() => onHeader('useLogoImage', true)} />
                  Imagen
                </label>
              </div>

              {!draft.header?.useLogoImage ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Logo principal</label>
                    <input className="input" placeholder="RK"
                      value={draft.header?.logo || 'RK'}
                      onChange={e => onHeader('logo', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Subtítulo</label>
                    <input className="input" placeholder="VINOS"
                      value={draft.header?.subtitle || 'VINOS'}
                      onChange={e => onHeader('subtitle', e.target.value)} />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Imagen (máx. 2MB)</label>
                  {draft.header?.logoImage ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img src={draft.header.logoImage} alt="Logo" style={{ height: 44, objectFit: 'contain', border: '1px solid var(--line)', borderRadius: 6, padding: 6 }} />
                      <button className="btn btnSm" onClick={() => { onHeader('logoImage', ''); onHeader('useLogoImage', false) }}>Quitar</button>
                    </div>
                  ) : (
                    <input type="file" className="input" accept="image/*" onChange={handleHeaderImageChange} />
                  )}
                </div>
              )}
            </div>

            {/* Preview: header real */}
            <div style={{ padding: 0, background: '#f3f3f6' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', padding: '8px 14px 4px' }}>
                Preview — como se ve en la tienda
              </div>
              <div style={{
                background: 'rgba(90,31,63,0.92)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                {/* search mock */}
                <div style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1, maxWidth: 160 }}>
                  ⌕ ¿Qué estás buscando?
                </div>
                {/* logo */}
                <div style={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
                  {draft.header?.useLogoImage && draft.header?.logoImage ? (
                    <img src={draft.header.logoImage} alt="Logo" style={{ height: 32, objectFit: 'contain' }} />
                  ) : (
                    <>
                      <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>
                        {draft.header?.logo || 'RK'}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8, letterSpacing: 3, fontWeight: 700 }}>
                        {draft.header?.subtitle || 'VINOS'}
                      </span>
                    </>
                  )}
                </div>
                {/* actions mock */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 8px', fontSize: 13, color: '#fff' }}>💬</div>
                  <div style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '5px 8px', fontSize: 13, color: '#fff' }}>🛒</div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#5a1f3f,#8b5a2b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>G</div>
                </div>
              </div>
              {/* nav bar */}
              <div style={{ background: 'rgba(255,255,255,0.92)', padding: '7px 20px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 16 }}>
                {['INICIO','PRODUCTOS','VINOS TINTOS','VINOS BLANCOS','ESPUMANTES'].map(l => (
                  <span key={l} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: 'rgba(0,0,0,0.65)' }}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            2. SLIDES PROMOCIONALES
        ══════════════════════════════════════════════════════════ */}
        <div style={cardStyle}>
          <div style={cardHeadStyle}>
            <span style={sectionLabel}>🎬 Slides promocionales</span>
            <button className="btn btnPrimary btnSm" onClick={addSlide}>+ Agregar slide</button>
          </div>

          {/* Tabs de slides */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
            {draft.slides?.map((sl, i) => (
              <button key={i} type="button"
                onClick={() => setActiveSlide(i)}
                style={{
                  padding: '9px 18px',
                  border: 'none',
                  borderBottom: activeSlide === i ? '2px solid #5a1f3f' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: activeSlide === i ? 700 : 500,
                  color: activeSlide === i ? '#5a1f3f' : 'var(--muted)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: sl.published ? '#00c853' : '#ff9800',
                  flexShrink: 0
                }} />
                Slide {i + 1}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

            {/* Controles del slide activo */}
            <div style={{ padding: 20, borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Título</label>
                  <input className="input" placeholder="Título"
                    value={s.title || ''}
                    onChange={e => onSlide(activeSlide, 'title', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Subtítulo</label>
                  <input className="input" placeholder="Subtítulo"
                    value={s.subtitle || ''}
                    onChange={e => onSlide(activeSlide, 'subtitle', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  {s.mediaType === 'none' || !s.mediaUrl ? 'Imagen o video de fondo' : `Archivo (${s.mediaType})`}
                </label>
                {s.mediaType === 'none' || !s.mediaUrl ? (
                  <input type="file" className="input" accept="image/*,video/*"
                    onChange={e => handleSlideMediaChange(activeSlide, e)} />
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.mediaFileName || 'Archivo cargado'}
                    </span>
                    <button className="btn btnSm" onClick={() => { onSlide(activeSlide,'mediaUrl',''); onSlide(activeSlide,'mediaType','none'); onSlide(activeSlide,'mediaFileName','') }}>
                      Cambiar
                    </button>
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Máx. 10MB · JPG, PNG, GIF, MP4, WEBM</div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  className="btn btnSm"
                  style={{
                    flex: 1,
                    background: s.published ? '#fff3e0' : '#e8f5e9',
                    border: `1px solid ${s.published ? '#ff9800' : '#00c853'}`,
                    color: s.published ? '#e65100' : '#1b5e20',
                    fontWeight: 700
                  }}
                  onClick={() => togglePublishSlide(activeSlide)}
                >
                  {s.published ? '⏸ Despublicar' : '▶ Publicar'}
                </button>
                {draft.slides?.length > 1 && (
                  <button className="btn btnSm adminActionDelete" onClick={() => removeSlide(activeSlide)}
                    style={{ color: '#c0392b', border: '1px solid #c0392b' }}>
                    <IcoTrash /> Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Preview del slide */}
            <div style={{ padding: 0, background: '#f3f3f6' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', padding: '8px 14px 4px' }}>
                Preview — como se ve en el carrusel
              </div>
              <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                {/* fondo */}
                {s.mediaType === 'image' && s.mediaUrl ? (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${s.mediaUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : s.mediaType === 'video' && s.mediaUrl ? (
                  <video src={s.mediaUrl} autoPlay muted loop playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #5a1f3f 0%, #8b2f5e 60%, #2c1a3a 100%)' }} />
                )}
                {/* overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(0,0,0,0.55),rgba(0,0,0,0.15) 55%,rgba(0,0,0,0.55))' }} />
                {/* contenido */}
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', gap: 6 }}>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {s.title || 'Título del slide'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    {s.subtitle || 'Subtítulo descriptivo'}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ background: '#d4af37', color: '#1a1a1a', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>Ver →</span>
                  </div>
                </div>
                {/* badge publicado */}
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: s.published ? '#00c853' : '#ff9800',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '3px 8px', borderRadius: 20
                }}>
                  {s.published ? '● PUBLICADO' : '● BORRADOR'}
                </div>
              </div>
              {/* dots mock */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '8px 0', background: '#fff' }}>
                {draft.slides?.map((_, i) => (
                  <div key={i} style={{
                    width: i === activeSlide ? 16 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: i === activeSlide ? '#5a1f3f' : '#ddd',
                    transition: 'all 0.2s'
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. HERO BANNER
        ══════════════════════════════════════════════════════════ */}
        <div style={cardStyle}>
          <div style={cardHeadStyle}>
            <span style={sectionLabel}>🎯 Banner principal (Hero)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

            {/* Controles */}
            <div style={{ padding: 20, borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Título principal</label>
                <input className="input" placeholder="RK Vinos"
                  value={draft.hero?.title || ''}
                  onChange={e => onHero('title', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Subtítulo / Promoción</label>
                <input className="input" placeholder="OFERTAS VINOS BLANCOS"
                  value={draft.hero?.subtitle || ''}
                  onChange={e => onHero('subtitle', e.target.value)} />
              </div>
            </div>

            {/* Preview fiel al Hero real */}
            <div style={{ padding: 0, background: '#f3f3f6' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', padding: '8px 14px 4px' }}>
                Preview — como se ve en la tienda
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #1a0a10 0%, #3d0f25 40%, #5a1f3f 100%)',
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  color: '#d4af37',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '3px 10px',
                  borderRadius: 20,
                  textTransform: 'uppercase'
                }}>
                  {draft.hero?.subtitle || 'OFERTAS VINOS BLANCOS'}
                </div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1.2 }}>
                  {draft.hero?.title || 'RK Vinos'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <div style={{ background: '#d4af37', color: '#1a1a1a', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>Ver oferta</div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>Ver catálogo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            4. FOOTER
        ══════════════════════════════════════════════════════════ */}
        <div style={cardStyle}>
          <div style={cardHeadStyle}>
            <span style={sectionLabel}>📄 Footer</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

            {/* Controles */}
            <div style={{ padding: 20, borderRight: '1px solid var(--line)' }}>
              <label style={labelStyle}>Texto del footer</label>
              <input className="input" placeholder="RK Vinos. Todos los derechos reservados."
                value={draft.footer || ''}
                onChange={e => setDraft(d => ({ ...d, footer: e.target.value }))} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                El año actual se agrega automáticamente al inicio.
              </p>
            </div>

            {/* Preview fiel al footer real */}
            <div style={{ padding: 0, background: '#f3f3f6' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', padding: '8px 14px 4px' }}>
                Preview — como se ve en la tienda
              </div>
              <div style={{
                background: '#1a1a1a',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                {/* links del footer */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {['Catálogo','Vinos Tintos','Vinos Blancos','Espumantes','FAQ'].map(l => (
                    <span key={l} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{l}</span>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    © {new Date().getFullYear()} {draft.footer || 'RK Vinos. Todos los derechos reservados.'}
                  </span>
                  <div style={{ display: 'grid', justifyItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>
                      {draft.header?.logo || 'RK'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, letterSpacing: 2, fontWeight: 700 }}>
                      {draft.header?.subtitle || 'VINOS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones flotantes al pie */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 8 }}>
          <button className="btn" onClick={reset}>Restaurar por defecto</button>
          <button className="btn btnPrimary" onClick={save} style={{ minWidth: 150 }}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function useCountdown(createdAt) {
  const [secs, setSecs] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
    return Math.max(0, 86400 - elapsed)
  })
  useEffect(() => {
    if (secs <= 0) return
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { display: `${h}:${m}:${s}`, expired: secs <= 0 }
}

function OrderCountdown({ createdAt }) {
  const { display, expired } = useCountdown(createdAt)
  return (
    <span style={{ fontSize: 12, color: expired ? '#e74c3c' : '#16a34a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      {expired ? 'Vencido' : display}
    </span>
  )
}

// ─── Modal Examinar ──────────────────────────────────────────────────────────
function OrderDetailModal({ order: initialOrder, onClose, onOrderUpdated }) {
  const [order, setOrder] = useState(initialOrder)
  const [confirmingStep, setConfirmingStep] = useState(null) // confirmar tilde
  const [notifyingStep, setNotifyingStep] = useState(null)   // notificar al cliente
  const [savingStep, setSavingStep] = useState(false)
  const { display, expired } = useCountdown(order.created_at)
  const payLabels = { mercadopago: 'Mercado Pago', transferencia: 'Transferencia Bancaria', efectivo: 'Efectivo al recibir' }
  const items = (() => { try { return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []) } catch { return [] } })()

  const steps = [
    { label: 'Pedido realizado',   checkpoint: null,                 done: true },
    { label: 'Pago confirmado',    checkpoint: 'pago_confirmado',    done: !!order.pago_confirmado },
    { label: 'Pedido empaquetado', checkpoint: 'pedido_empaquetado', done: !!order.pedido_empaquetado },
    { label: 'Pedido enviado',     checkpoint: 'pedido_enviado',     done: !!order.pedido_enviado },
  ]

  // Marca el paso como completado (tilde verde) — SIN email
  async function doConfirmStep() {
    if (!confirmingStep) return
    setSavingStep(true)
    try {
      const { confirmOrderStep } = await import('../api/axiosDrinks.js')
      await confirmOrderStep(order.id, confirmingStep.checkpoint, false) // false = sin email
      const updated = { ...order, [confirmingStep.checkpoint]: true }
      if (confirmingStep.checkpoint === 'pago_confirmado') updated.pago_confirmado_fecha = new Date().toISOString()
      setOrder(updated)
      if (onOrderUpdated) onOrderUpdated(updated)
    } catch { alert('Error al confirmar el paso. Intentá de nuevo.') }
    finally { setSavingStep(false); setConfirmingStep(null) }
  }

  // Envía el email al cliente — SIN cambiar el estado del paso
  async function doNotifyStep() {
    if (!notifyingStep) return
    setSavingStep(true)
    try {
      const { confirmOrderStep } = await import('../api/axiosDrinks.js')
      await confirmOrderStep(order.id, notifyingStep.checkpoint, true) // true = solo email
    } catch { alert('Error al enviar la notificación. Intentá de nuevo.') }
    finally { setSavingStep(false); setNotifyingStep(null) }
  }

  return (
    <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>

        {/* Cliente */}
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0e8e0' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a0a0a', marginBottom: 4 }}>{order.full_name}</div>
          <div style={{ fontSize: 13, color: '#666' }}>{order.email}</div>
          {order.phone && <div style={{ fontSize: 13, color: '#666' }}>{order.phone}</div>}
        </div>

        {/* Entrega estimada */}
        <div style={{ background: '#f9f6f2', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Truck size={28} style={{ color: '#3b82f6' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1a0a0a' }}></div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{order.address ? `Destino: ${order.address}, ${order.city}` : 'Sin dirección'}</div>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f9f6f2', borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#888' }}>Método de pago: </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a0a0a' }}>{payLabels[order.payment_method] || order.payment_method}</span>
          {order.payment_code && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Código de pago: </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#5a1f3f' }}>{order.payment_code}</span>
            </div>
          )}
        </div>

        {/* Contador */}
        <div style={{ marginBottom: 20, padding: '12px 16px', background: expired ? '#fef2f2' : '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${expired ? '#fecaca' : '#bbf7d0'}` }}>
          <span style={{ fontSize: 20 }}>{expired ? '⏰' : '⏱'}</span>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>Tiempo restante para procesar</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: expired ? '#e74c3c' : '#16a34a', letterSpacing: 2 }}>{display}</div>
          </div>
        </div>

        {/* Timeline de pasos */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 12 }}>SEGUIMIENTO DEL PEDIDO</div>
          {steps.map((st, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', alignItems: 'flex-start' }}>
              {/* Línea vertical */}
              {i < steps.length - 1 && (
                <div style={{ position: 'absolute', left: 11, top: 28, width: 2, height: 36, background: st.done ? '#16a34a' : '#e5e7eb' }} />
              )}

              {/* Círculo */}
              {st.checkpoint && !st.done ? (
                // Pendiente → círculo clickeable para confirmar
                <button
                  onClick={() => setConfirmingStep(st)}
                  title="Marcar como completado"
                  style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: '#e5e7eb', border: '2px dashed #9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2, zIndex: 1, cursor: 'pointer', padding: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#d1fae5'; e.currentTarget.style.borderColor = '#16a34a' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.borderColor = '#9ca3af' }}
                />
              ) : (
                // Done o sin checkpoint → círculo estático
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: st.done ? '#16a34a' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2, zIndex: 1
                }}>
                  {st.done && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
              )}

              {/* Contenido del paso */}
              <div style={{ paddingBottom: 24, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: st.done ? 700 : 400, color: st.done ? '#1a0a0a' : '#9ca3af' }}>
                    {st.label}
                  </span>

                  {/* Si está pendiente: hint de click */}
                  {!st.done && st.checkpoint && (
                    <span style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>
                      click al círculo para confirmar
                    </span>
                  )}

                  {/* Si ya está confirmado: botón "Notificar al cliente" */}
                  {st.done && st.checkpoint && (
                    <button
                      onClick={() => setNotifyingStep(st)}
                      style={{
                        fontSize: 11, fontWeight: 700,
                        color: '#5a1f3f', background: 'rgba(90,31,63,0.07)',
                        border: '1px solid rgba(90,31,63,0.2)',
                        borderRadius: 6, padding: '2px 10px',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,31,63,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(90,31,63,0.07)'}
                    >
                      📧 Notificar al cliente
                    </button>
                  )}
                </div>

                {st.done && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                    {new Date(order.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} · {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div style={{ borderTop: '1px solid #f0e8e0', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#888', letterSpacing: 1 }}>PRODUCTOS</div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid #f5f0ea' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a0a0a', marginBottom: 2 }}>{it.wineName}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {it.wineType && <span style={{ textTransform: 'capitalize', marginRight: 8 }}>{it.wineType}</span>}
                  {it.winery && <span>· {it.winery}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#5a1f3f', fontWeight: 600, marginTop: 2 }}>Cantidad: {it.quantity}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1a0a0a', flexShrink: 0 }}>
                ${((it.price || 0) * it.quantity).toLocaleString('es-AR')}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginTop: 12, paddingTop: 12, borderTop: '2px solid #f0e8e0' }}>
            <span>Total</span>
            <span style={{ color: '#5a1f3f' }}>${(order.total || 0).toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── Confirmación de paso (tilde verde, sin email) ── */}
    {confirmingStep && createPortal(
      <div onClick={() => !savingStep && setConfirmingStep(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#1a0a0a' }}>¿Confirmar paso?</h3>
          <p style={{ margin: '0 0 8px', fontSize: 15, color: '#555', lineHeight: 1.5 }}>
            ¿Estás seguro que querés marcar{' '}
            <strong style={{ color: '#16a34a' }}>{confirmingStep.label}</strong> como completado?
          </p>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#888' }}>
            Podés notificar al cliente por separado con el botón "Notificar al cliente".
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btnPrimary" onClick={doConfirmStep} disabled={savingStep}
              style={{ minWidth: 110, background: '#16a34a', borderColor: '#16a34a' }}>
              {savingStep ? 'Confirmando...' : 'Aceptar'}
            </button>
            <button className="btn" onClick={() => setConfirmingStep(null)} disabled={savingStep} style={{ minWidth: 110 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Confirmación de notificación (solo email) ── */}
    {notifyingStep && createPortal(
      <div onClick={() => !savingStep && setNotifyingStep(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000, padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#1a0a0a' }}>¿Notificar al cliente?</h3>
          <p style={{ margin: '0 0 24px', fontSize: 15, color: '#555', lineHeight: 1.5 }}>
            Se enviará un email a <strong>{order.email}</strong> informando que{' '}
            <strong style={{ color: '#5a1f3f' }}>{notifyingStep.label}</strong> fue confirmado.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btnPrimary" onClick={doNotifyStep} disabled={savingStep} style={{ minWidth: 110 }}>
              {savingStep ? 'Enviando...' : 'Aceptar'}
            </button>
            <button className="btn" onClick={() => setNotifyingStep(null)} disabled={savingStep} style={{ minWidth: 110 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  )
}

// ─── PedidosSection ──────────────────────────────────────────────────────────
function PedidosSection() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [examining, setExamining]     = useState(null)   // order seleccionada
  const [confirming, setConfirming]   = useState(null)   // {order, newStatus}
  const [updatingId, setUpdatingId]   = useState(null)
  const [message, setMessage]         = useState('')
  const [rejecting, setRejecting]     = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  async function loadOrders() {
    setLoading(true)
    try {
      const { getOrders } = await import('../api/axiosDrinks.js')
      setOrders(await getOrders())
    } catch { setMessage('Error al cargar pedidos') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadOrders() }, [])

  async function confirmStatusChange() {
    if (!confirming) return
    setUpdatingId(confirming.order.id)
    try {
      const { updateOrderStatus } = await import('../api/axiosDrinks.js')
      await updateOrderStatus(confirming.order.id, confirming.newStatus)
      setOrders(prev => prev.map(o => o.id === confirming.order.id ? { ...o, status: confirming.newStatus } : o))
      flash(`Estado actualizado a ${confirming.newStatus === 'aprobado' ? 'APROBADO' : 'EN PROCESO'}`)
    } catch { flash('Error al actualizar estado') }
    finally { setUpdatingId(null); setConfirming(null) }
  }

  async function handleRejectOrder() {
    if (!rejecting || !rejectReason.trim()) return
    setUpdatingId(rejecting.id)
    try {
      const { rejectOrder } = await import('../api/axiosDrinks.js')
      await rejectOrder(rejecting.id, rejectReason)
      setOrders(prev => prev.map(o => o.id === rejecting.id ? { ...o, status: 'rechazado', rejection_reason: rejectReason } : o))
      flash('Pedido rechazado')
      setRejecting(null)
      setRejectReason('')
    } catch { flash('Error al rechazar pedido') }
    finally { setUpdatingId(null) }
  }

  async function handleDeleteOrder(id) {
    if (!confirm(`¿Estás seguro de eliminar este pedido?`)) return
    setUpdatingId(id)
    try {
      const { deleteOrder } = await import('../api/axiosDrinks.js')
      await deleteOrder(id)
      setOrders(prev => prev.filter(o => o.id !== id))
      flash('Pedido eliminado')
    } catch { flash('Error al eliminar pedido') }
    finally { setUpdatingId(null) }
  }

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const payLabel = { mercadopago: 'Mercado Pago', transferencia: 'Transferencia', efectivo: 'Efectivo' }

  return (
    <div className="adminSection">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="adminSectionTitle" style={{ margin: 0 }}>Administrar pedidos ({orders.length})</h2>
        <button className="btn btnPrimary" onClick={loadOrders}>↻ Actualizar</button>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#166534', fontSize: 13 }}>{message}</div>
      )}

      {loading ? (
        <div className="muted">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="muted">No hay pedidos todavía.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => {
            const isAprobado = order.status === 'aprobado'
            const newStatus  = isAprobado ? 'en_proceso' : 'aprobado'
            return (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>

                {/* Izquierda — cliente */}
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a0a0a' }}>{order.email}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{order.full_name}</div>
                </div>

                {/* Centro — pago + total */}
                <div style={{ flex: 1, fontSize: 13, color: '#555' }}>
                  <div>{payLabel[order.payment_method] || order.payment_method}</div>
                  <div style={{ fontWeight: 700, color: '#1a0a0a' }}>${(order.total || 0).toLocaleString('es-AR')}</div>
                </div>

                {/* Estado + fecha + contador */}
                <div style={{ minWidth: 160, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button
                    onClick={() => setConfirming({ order, newStatus })}
                    disabled={updatingId === order.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content'
                    }}
                  >
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                      background: isAprobado ? '#dcfce7' : '#fff7ed',
                      color:      isAprobado ? '#16a34a' : '#ea580c',
                      border:     `1px solid ${isAprobado ? '#bbf7d0' : '#fed7aa'}`
                    }}>
                      {isAprobado ? '● APROBADO' : '● EN PROCESO'}
                    </span>
                  </button>
                  <span style={{ fontSize: 11, color: '#aaa' }}>
                    {new Date(order.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <OrderCountdown createdAt={order.created_at} />
                </div>

                {/* Botón Examinar */}
                <button
                  className="adminActionBtn adminActionEdit"
                  onClick={() => setExamining(order)}
                  style={{ flexShrink: 0 }}
                >
                  🔍 Examinar
                </button>

                {/* Botón Rechazar */}
                <button
                  className="adminActionBtn"
                  onClick={() => setRejecting(order)}
                  disabled={updatingId === order.id || order.status === 'rechazado'}
                  style={{ flexShrink: 0, background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626' }}
                  title="Rechazar pedido"
                >
                  ❌ Rechazar
                </button>

                {/* Botón Eliminar */}
                <button
                  className="adminActionBtn"
                  onClick={() => handleDeleteOrder(order.id)}
                  disabled={updatingId === order.id}
                  style={{ flexShrink: 0, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280' }}
                  title="Eliminar pedido"
                >
                  🗑️ Eliminar
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Rechazar */}
      {rejecting && (
        <div onClick={() => { setRejecting(null); setRejectReason('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>❌</div>
            <p style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#1a0a0a', lineHeight: 1.5 }}>
              ¿Por qué rechazás el pedido <strong>#{rejecting.id}</strong>?
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Escribe el motivo del rechazo..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 20,
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setRejecting(null); setRejectReason('') }}
                className="btn"
                style={{ padding: '12px 24px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={!rejectReason.trim() || updatingId === rejecting.id}
                className="btn btnPrimary"
                style={{ padding: '12px 24px', background: '#dc2626', borderColor: '#dc2626' }}
              >
                {updatingId === rejecting.id ? 'Rechazando...' : 'Rechazar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Examinar */}
      {examining && <OrderDetailModal order={examining} onClose={() => setExamining(null)} onOrderUpdated={updatedOrder => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
        setExamining(updatedOrder)
      }} />}

      {/* Modal confirmación cambio de estado */}
      {confirming && (
        <div onClick={() => setConfirming(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔄</div>
            <p style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#1a0a0a', lineHeight: 1.5 }}>
              ¿Querés cambiar el estado de{' '}
              <strong style={{ color: confirming.order.status === 'aprobado' ? '#ea580c' : '#16a34a' }}>
                {confirming.order.status === 'aprobado' ? 'APROBADO' : 'EN PROCESO'}
              </strong>
              {' '}a{' '}
              <strong style={{ color: confirming.newStatus === 'aprobado' ? '#16a34a' : '#ea580c' }}>
                {confirming.newStatus === 'aprobado' ? 'APROBADO' : 'EN PROCESO'}
              </strong>
              ?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btnPrimary" onClick={confirmStatusChange} disabled={!!updatingId} style={{ minWidth: 100 }}>
                Sí
              </button>
              <button className="btn" onClick={() => setConfirming(null)} style={{ minWidth: 100 }}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FeedbackSection() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/pilot-feedback')
      const data = await response.json()
      setItems(data)
    } catch { setMessage('Error al cargar feedback') }
    finally { setLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este feedback?')) return
    setDeleting(id)
    try {
      const response = await fetch(`http://localhost:3000/pilot-feedback/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        flash('Feedback eliminado correctamente')
        load()
      } else {
        setMessage('Error al eliminar feedback')
      }
    } catch { setMessage('Error al eliminar feedback') }
    finally { setDeleting(null) }
  }

  useEffect(() => { load() }, [])

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  return (
    <div className="adminSection">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 className="adminSectionTitle" style={{ margin: 0 }}>Feedback Fase Piloto</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            {items.length} opinión{items.length !== 1 ? 'es' : ''} recibida{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btnPrimary" onClick={load}>↻ Actualizar</button>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', display: 'flex', gap: 8 }}>
        <span>🔒</span>
        <span>Estas opiniones son <strong>completamente privadas</strong>. Los clientes fueron informados de que solo el equipo de RK Vinos tiene acceso.</span>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#166534', fontSize: 13 }}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="muted">Cargando feedback...</div>
      ) : items.length === 0 ? (
        <div className="muted">Todavía no hay opiniones registradas.</div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Feedback</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {f.profile_picture ? (
                      <img
                        src={f.profile_picture}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#5a1f3f',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        {f.name ? f.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span>{f.name || 'Usuario'}</span>
                  </td>
                  <td>{f.email || '—'}</td>
                  <td style={{ maxWidth: '400px', whiteSpace: 'pre-wrap' }}>{f.feedback}</td>
                  <td>{new Date(f.created_at).toLocaleDateString('es-AR')}</td>
                  <td>
                    <button
                      className="adminActionBtn adminActionDelete"
                      onClick={() => handleDelete(f.id)}
                      disabled={deleting === f.id}
                    >
                      {deleting === f.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ResenasSection() {
  const [tab, setTab]           = useState('resenas')   // 'resenas' | 'comentarios'
  const [reviews, setReviews]   = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [message, setMessage]   = useState('')

  async function loadAll() {
    setLoading(true)
    try {
      const { getReviews, getAllWineComments } = await import('../api/axiosDrinks.js')
      const [rev, com] = await Promise.all([getReviews(), getAllWineComments()])
      setReviews(rev)
      setComments(com)
    } catch {
      setMessage('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function handleDeleteReview(id) {
    if (!window.confirm('¿Eliminar esta reseña?')) return
    setDeleting(id)
    try {
      const { deleteReview } = await import('../api/axiosDrinks.js')
      await deleteReview(id, null, true)
      setReviews(r => r.filter(x => x.id !== id))
      flash('Reseña eliminada')
    } catch { flash('Error al eliminar') }
    finally { setDeleting(null) }
  }

  async function handleDeleteComment(id) {
    if (!window.confirm('¿Eliminar este comentario?')) return
    setDeleting(id)
    try {
      const { deleteWineComment } = await import('../api/axiosDrinks.js')
      await deleteWineComment(id, null, true)
      setComments(c => c.filter(x => x.id !== id))
      flash('Comentario eliminado')
    } catch { flash('Error al eliminar') }
    finally { setDeleting(null) }
  }

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n)
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  function UserCell({ row }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {row.profile_picture
          ? <img src={row.profile_picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#5a1f3f,#b01a2c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>{(row.user_name || 'U').charAt(0).toUpperCase()}</div>
        }
        <span style={{ fontWeight: 600 }}>{row.user_name}</span>
      </div>
    )
  }

  return (
    <div className="adminSection">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="adminSectionTitle" style={{ margin: 0 }}>Reseñas y comentarios</h2>
        <button className="btn btnPrimary" onClick={loadAll}>↻ Actualizar</button>
      </div>

      {/* Aviso */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <span>Cada usuario puede publicar <strong>una sola reseña</strong> y <strong>un comentario por vino</strong>. Solo se permiten opiniones respetuosas. Eliminá cualquier contenido inapropiado desde esta sección.</span>
      </div>

      {/* Mensaje feedback */}
      {message && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#166534', fontSize: 13 }}>
          {message}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--line)', paddingBottom: 0 }}>
        {[
          { id: 'resenas',     label: `Reseñas generales (${reviews.length}) · Promedio: ${avg} ★` },
          { id: 'comentarios', label: `Comentarios por vino (${comments.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid #5a1f3f' : '2px solid transparent',
              color: tab === t.id ? '#5a1f3f' : 'var(--muted)',
              marginBottom: -2,
              transition: 'color 0.18s'
            }}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="muted">Cargando...</div>
      ) : tab === 'resenas' ? (
        /* ── Tab reseñas generales ── */
        reviews.length === 0 ? (
          <div className="muted">No hay reseñas todavía.</div>
        ) : (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr><th>Usuario</th><th>Calificación</th><th>Comentario</th><th>Fecha</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id}>
                    <td><UserCell row={r} /></td>
                    <td>
                      <span style={{ color: '#f5a623', fontSize: 15, letterSpacing: 1 }}>{stars(r.rating)}</span>
                      <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--muted)' }}>{r.rating}/5</span>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{r.comment}"
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="adminActionBtn adminActionDelete" onClick={() => handleDeleteReview(r.id)} disabled={deleting === r.id}>
                        <IcoTrash /> {deleting === r.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ── Tab comentarios por vino ── */
        comments.length === 0 ? (
          <div className="muted">No hay comentarios por vino todavía.</div>
        ) : (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr><th>Usuario</th><th>Vino</th><th>Comentario</th><th>Fecha</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {comments.map(c => (
                  <tr key={c.id}>
                    <td><UserCell row={c} /></td>
                    <td>
                      <a
                        href={`/vino/${c.wine_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 13, color: '#5a1f3f', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {c.wine_slug}
                      </a>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{c.comment}"
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="adminActionBtn adminActionDelete" onClick={() => handleDeleteComment(c.id)} disabled={deleting === c.id}>
                        <IcoTrash /> {deleting === c.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

function IngresarProductosSection() {
  const [form, setForm] = useState({ 
    wineType: 'tinto',
    name: '', 
    type: '', 
    cepa: '', 
    price: '', 
    stock: '', 
    year: '', 
    region: '', 
    winery: '', 
    volumeMl: '750', 
    description: '', 
    notes: '', 
    pairing: '', 
    image: null,
    featured: false
  })
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { refetch } = useWines()

  function onChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setMessage('') }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(f => ({ ...f, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.cepa.trim()) {
      setMessage('Nombre y cepa son requeridos')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const wineData = {
        name: form.name,
        type: form.type,
        cepa: form.cepa,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        year: Number(form.year) || null,
        region: form.region || null,
        winery: form.winery || null,
        volumeMl: Number(form.volumeMl) || 750,
        description: form.description || null,
        notes: form.notes || null,
        pairing: form.pairing || null,
        image: form.image || null,
        featured: form.featured
      }

      let createFunction
      if (form.wineType === 'tinto') {
        const { createRedWine } = await import('../api/axiosDrinks.js')
        createFunction = createRedWine
      } else if (form.wineType === 'blanco') {
        const { createWhiteWine } = await import('../api/axiosDrinks.js')
        createFunction = createWhiteWine
      } else {
        const { createRoseWine } = await import('../api/axiosDrinks.js')
        createFunction = createRoseWine
      }

      await createFunction(wineData)
      setMessage(`"${form.name}" agregado exitosamente como ${form.wineType}`)
      setForm({ 
        wineType: form.wineType,
        name: '', 
        type: '', 
        cepa: '', 
        price: '', 
        stock: '', 
        year: '', 
        region: '', 
        winery: '', 
        volumeMl: '750', 
        description: '', 
        notes: '', 
        pairing: '', 
        image: null,
        featured: false
      })
      setImageFile(null)
      refetch()
    } catch (error) {
      setMessage('Error al agregar el vino: ' + (error.response?.data?.mensaje || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adminSection">
      <h2 className="adminSectionTitle">Ingresar <span>productos</span></h2>
      <div style={{
        padding: 28,
        maxWidth: 800,
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
        border: '1px solid rgba(139, 0, 0, 0.3)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 className="adminSubTitle" style={{ marginTop: 0, color: 'rgba(255, 255, 255, 0.9)' }}>Agregar nuevo vino</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="adminConfigLabel">Tipo de vino *</label>
              <select 
                className="input" 
                name="wineType" 
                value={form.wineType} 
                onChange={onChange}
              >
                <option value="tinto">Tinto</option>
                <option value="blanco">Blanco</option>
                <option value="espumante">Espumante/Rosé</option>
              </select>
            </div>
            <div>
              <label className="adminConfigLabel">Nombre del vino *</label>
              <input 
                className="input" 
                name="name" 
                placeholder="Ej: Malbec Reserva" 
                value={form.name} 
                onChange={onChange} 
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="adminConfigLabel">Cepa *</label>
              <input 
                className="input" 
                name="cepa" 
                placeholder="Ej: Malbec, Cabernet Sauvignon" 
                value={form.cepa} 
                onChange={onChange} 
              />
            </div>
            <div>
              <label className="adminConfigLabel">Tipo/Categoría</label>
              <input 
                className="input" 
                name="type" 
                placeholder="Ej: Reserva, Gran Reserva" 
                value={form.type} 
                onChange={onChange} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="adminConfigLabel">Precio (ARS)</label>
              <input 
                className="input" 
                name="price" 
                type="number"
                placeholder="Ej: 18900" 
                value={form.price} 
                onChange={onChange} 
              />
            </div>
            <div>
              <label className="adminConfigLabel">Stock</label>
              <input 
                className="input" 
                name="stock" 
                type="number"
                placeholder="Ej: 12" 
                value={form.stock} 
                onChange={onChange} 
              />
            </div>
            <div>
              <label className="adminConfigLabel">Año</label>
              <input 
                className="input" 
                name="year" 
                type="number"
                min="1900"
                max="2155"
                placeholder="Ej: 2022" 
                value={form.year} 
                onChange={onChange} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="adminConfigLabel">Región</label>
              <input 
                className="input" 
                name="region" 
                placeholder="Ej: Mendoza" 
                value={form.region} 
                onChange={onChange} 
              />
            </div>
            <div>
              <label className="adminConfigLabel">Bodega</label>
              <input 
                className="input" 
                name="winery" 
                placeholder="Ej: Bodega RK" 
                value={form.winery} 
                onChange={onChange} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="adminConfigLabel">Volumen (ml)</label>
              <input 
                className="input" 
                name="volumeMl" 
                type="number"
                placeholder="Ej: 750" 
                value={form.volumeMl} 
                onChange={onChange} 
              />
            </div>
            <div>
              <label className="adminConfigLabel">Imagen del producto</label>
              <input 
                className="input" 
                type="file"
                accept="image/*"
                onChange={handleImageChange} 
              />
              {imageFile && <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>{imageFile.name}</div>}
            </div>
          </div>

          <div>
            <label className="adminConfigLabel">Descripción</label>
            <textarea 
              className="input" 
              name="description" 
              placeholder="Descripción del vino..." 
              value={form.description} 
              onChange={onChange}
              rows={3}
            />
          </div>

          <div>
            <label className="adminConfigLabel">Notas de cata (separadas por comas)</label>
            <textarea 
              className="input" 
              name="notes" 
              placeholder="Ej: Fruta negra, Especias, Cacao" 
              value={form.notes} 
              onChange={onChange}
              rows={2}
            />
          </div>

          <div>
            <label className="adminConfigLabel">Maridaje (separado por comas)</label>
            <textarea 
              className="input" 
              name="pairing" 
              placeholder="Ej: Carnes rojas, Pastas, Quesos" 
              value={form.pairing} 
              onChange={onChange}
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <input 
              type="checkbox" 
              id="featured"
              name="featured" 
              checked={form.featured} 
              onChange={(e) => setForm(f => ({ ...f, featured: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="featured" style={{ cursor: 'pointer', fontWeight: 600 }}>
              Mostrar en destacados del home
            </label>
          </div>

          {message && (
            <div style={{ 
              color: message.includes('Error') ? '#e74c3c' : '#00c48c', 
              fontSize: 13, 
              fontWeight: 600,
              padding: 8,
              background: message.includes('Error') ? '#fee' : '#efe'
            }}>
              {message}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button 
              className="btn btnPrimary" 
              type="submit" 
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Agregando...' : 'Agregar vino'}
            </button>
            <button 
              className="btn" 
              type="button"
              onClick={() => refetch()}
            >
              Ver cambios en catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UsuariosSection({ clients, setClients }) {
  const [q, setQ]           = useState('')
  const [form, setForm]     = useState({ name: '', email: '', phone: '' })
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [clientToDelete, setClientToDelete] = useState(null)

  const filtered = useMemo(() => {
    const lq = q.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(lq) || c.email.toLowerCase().includes(lq))
  }, [clients, q])

  function onChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setFormError('') }

  function addClient(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { setFormError('Nombre y email son requeridos'); return }
    if (clients.some(c => c.email === form.email.trim())) { setFormError('Ya existe un cliente con ese email'); return }
    setClients(prev => [...prev, { id: `c${Date.now()}`, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), registeredAt: new Date().toISOString().slice(0, 10), online: false }])
    setForm({ name: '', email: '', phone: '' })
  }

  async function deleteClient(id) {
    try {
      setDeleting(id)
      const response = await deleteUser(id)
      if (response.success) {
        setClients(prev => prev.filter(c => c.id !== id))
        setClientToDelete(null)
      } else {
        alert('Error al eliminar cliente: ' + response.mensaje)
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      alert('Error de conexión al eliminar cliente')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="adminSection">
      <h2 className="adminSectionTitle">Gestión de usuarios</h2>
      <div className="adminUsersGrid">
        <div className="card" style={{ padding: 20 }}>
          <h3 className="adminSubTitle" style={{ marginTop: 0 }}>Registrar cliente</h3>
          <form onSubmit={addClient} style={{ display: 'grid', gap: 10 }}>
            <input className="input" name="name"  placeholder="Nombre y apellido"  value={form.name}  onChange={onChange} />
            <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} />
            <input className="input" name="phone" placeholder="Teléfono (opcional)" value={form.phone} onChange={onChange} />
            {formError && <div style={{ color: '#e74c3c', fontSize: 13 }}>{formError}</div>}
            <button className="btn btnPrimary" type="submit">Registrar</button>
          </form>
        </div>
        <div>
          <h3 className="adminSubTitle" style={{ marginTop: 0 }}>Lista de clientes ({clients.length})</h3>
          <input className="input adminSearch" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} />
          <div className="adminTableWrap" style={{ marginTop: 12 }}>
            <table className="adminTable">
              <thead><tr><th>Nombre</th><th>Email</th><th>Registrado</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.registeredAt}</td>
                    <td><span className={`adminBadge ${c.online ? 'adminBadgeGreen' : 'adminBadgeGray'}`}>{c.online ? 'En línea' : 'Offline'}</span></td>
                    <td>
                      <button 
                        className="adminActionBtn adminActionDelete" 
                        onClick={() => setClientToDelete(c)}
                        disabled={deleting === c.id}
                        style={{ opacity: deleting === c.id ? 0.6 : 1, cursor: deleting === c.id ? 'not-allowed' : 'pointer' }}
                      >
                        <IcoTrash /> {deleting === c.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {clientToDelete && (
        <div
          onClick={() => !deleting && setClientToDelete(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideInUp 0.3s ease-out'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>

            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: '700',
              textAlign: 'center',
              color: '#333'
            }}>
              ¿Estás seguro?
            </h3>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              textAlign: 'center',
              color: '#666',
              lineHeight: '1.5'
            }}>
              ¿Deseas eliminar al cliente <strong style={{ color: '#333' }}>{clientToDelete.name}</strong>?
              <br />
              <span style={{ fontSize: '14px', color: '#999' }}>Esta acción no se puede deshacer.</span>
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setClientToDelete(null)}
                disabled={deleting}
                style={{
                  padding: '12px 32px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  opacity: deleting ? 0.6 : 1
                }}
                onMouseOver={(e) => !deleting && (e.target.style.background = '#e0e0e0')}
                onMouseOut={(e) => !deleting && (e.target.style.background = '#f0f0f0')}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteClient(clientToDelete.id)}
                disabled={deleting}
                style={{
                  padding: '12px 32px',
                  background: deleting ? '#ccc' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !deleting && (e.target.style.background = '#c0392b')}
                onMouseOut={(e) => !deleting && (e.target.style.background = '#e74c3c')}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => { try { return sessionStorage.getItem('rk_admin_auth') === '1' } catch { return false } })
  const [section, setSection] = useState('dashboard')
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { wines } = useWines()

  useEffect(() => {
    if (authed) {
      loadUsers()
    }
  }, [authed])

  async function loadUsers() {
    try {
      setClientsLoading(true)
      const response = await getAllUsers()
      if (response.success) {
        setClients(response.users)
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    } finally {
      setClientsLoading(false)
    }
  }

  function login()  { try { sessionStorage.setItem('rk_admin_auth', '1')    } catch {}; setAuthed(true)  }
  function logout() { try { sessionStorage.removeItem('rk_admin_auth')       } catch {}; setAuthed(false) }

  if (!authed) return <PasswordGate onAuth={login} />

  return (
    <div className="adminLayout">
      {/* Botón hamburguesa móvil */}
      <button
        className="adminMobileMenuBtn"
        onClick={() => setShowMobileSidebar(true)}
        aria-label="Abrir menú"
        style={{
          display: 'none',
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 998,
          background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
          color: '#0d0d0d',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '12px',
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
          fontSize: 24,
          fontWeight: 'bold'
        }}
      >
        ☰
      </button>

      <Sidebar 
        section={section} 
        setSection={setSection} 
        onLogout={logout}
        showMobile={showMobileSidebar}
        setShowMobile={setShowMobileSidebar}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <main className="adminMain">
        {section === 'dashboard'     && <DashboardSection    clients={clients} clientsLoading={clientsLoading} />}
        {section === 'clientes'      && <ClientesSection />}
        {section === 'productos'     && <ProductosSection />}
        {section === 'ingresar'      && <IngresarProductosSection />}
        {section === 'pedidos'       && <PedidosSection />}
        {section === 'resenas'       && <ResenasSection />}
        {section === 'feedback'      && <FeedbackSection />}
        {section === 'estadisticas'  && <EstadisticasSection wines={wines} />}
        {section === 'configuracion' && <ConfiguracionSection />}
        {section === 'usuarios'      && <UsuariosSection     clients={clients} setClients={setClients} />}
      </main>
    </div>
  )
}
