import React, { useEffect, useMemo, useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CONFIG_INIT } from '../pages/Admin.jsx'
import VirtualAssistant from './VirtualAssistant.jsx'

function loadHeaderConfig() {
  try {
    const raw = localStorage.getItem('rk_admin_config')
    if (raw) return JSON.parse(raw).header || CONFIG_INIT.header
  } catch {}
  return CONFIG_INIT.header
}

function linkClass({ isActive }) {
  return `navLink ${isActive ? 'navLinkActive' : ''}`
}

// ─── Mapa de bodegas por región ─────────────────────────────────────────────
const REGIONES = [
  {
    nombre: 'NOA (Noroeste)',
    bodegas: [
      { nombre: 'Amalaya',                region: 'Cafayate, Salta'          },
      { nombre: 'El Esteco',              region: 'Cafayate, Salta'          },
      { nombre: 'San Pedro de Yacochuya', region: 'Cafayate, Salta'          },
      { nombre: 'Chico Zossi',            region: 'Colalao del Valle, Tucumán'},
      { nombre: 'Las Arcas de Tolombón',  region: 'Colalao del Valle, Tucumán'},
    ],
  },
  {
    nombre: 'Cuyo',
    bodegas: [
      { nombre: 'Bianchi',         region: 'Mendoza' },
      { nombre: 'Bousquet',        region: 'Valle de Uco' },
      { nombre: 'Catena Zapata',   region: 'Mendoza' },
      { nombre: 'Jorge Rubio',     region: 'Oasis Sur, Mendoza' },
      { nombre: 'La Rural',        region: 'Mendoza' },
      { nombre: 'Lamadrid',        region: 'Luján de Cuyo' },
      { nombre: 'Luigi Bosca',     region: 'Mendoza' },
      { nombre: 'Trapiche',        region: 'Mendoza' },
      { nombre: 'Viña Las Perdices', region: 'Luján de Cuyo' },
      { nombre: 'Rutini Wines',    region: 'Valle de Uco' },
    ],
  },
  {
    nombre: 'Región Pampeana',
    bodegas: [
      { nombre: 'Del Desierto', region: '25 de Mayo, La Pampa' },
    ],
  },
]

// Convierte "Bodega X" → "/catalogo?winery=Bodega+X"
function wineryLink(nombre) {
  return `/catalogo?winery=${encodeURIComponent(nombre)}`
}

// ─── Componente dropdown Bodegas ────────────────────────────────────────────
function BodegasDropdown() {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)  // null = no calculado aún
  const triggerRef = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function calcPosition() {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const panelWidth = 680
    const viewportWidth = window.innerWidth
    let left = rect.left + rect.width / 2 - panelWidth / 2
    if (left < 12) left = 12
    if (left + panelWidth > viewportWidth - 12) left = viewportWidth - panelWidth - 12
    return {
      position: 'fixed',
      top: rect.bottom + 6,
      left,
      width: panelWidth,
      zIndex: 99999,
    }
  }

  function handleOpen() {
    const style = calcPosition()
    if (style) {
      setPanelStyle(style)
      setOpen(true)
    }
  }

  function handleClose() {
    setOpen(false)
    setPanelStyle(null)
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="navLink prodDropdownTrigger"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={() => open ? handleClose() : handleOpen()}
      >
        BODEGAS <span className="prodDropdownArrow" style={{ opacity: open ? 1 : 0.6 }}>▾</span>
      </button>

      {open && panelStyle && createPortal(
        <div
          ref={ref}
          className="prodDropdownPanel"
          style={panelStyle}
        >
          <div className="prodDropdownGrid">
            {REGIONES.map(r => (
              <div key={r.nombre} className="prodDropdownCol">
                <div className="prodDropdownRegion">{r.nombre}</div>
                <ul className="prodDropdownList">
                  {r.bodegas.map(b => (
                    <li key={b.nombre}>
                      <a
                        href={wineryLink(b.nombre)}
                        className="prodDropdownLink"
                        onClick={handleClose}
                      >
                        {b.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="prodDropdownCol">
              <div className="prodDropdownRegion">Por tipo</div>
              <ul className="prodDropdownList">
                {[
                  { label: 'Vinos Tintos',  to: '/categoria/tinto'     },
                  { label: 'Vinos Blancos', to: '/categoria/blanco'    },
                  { label: 'Espumantes',    to: '/categoria/espumante' },
                  { label: 'Ver todo',      to: '/catalogo'            },
                ].map(l => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      className="prodDropdownLink prodDropdownLinkBold"
                      onClick={handleClose}
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Menú móvil con navegación por niveles ──────────────────────────────────
function MobileMenuPanel({ menu, user, onClose, onLinkClick }) {
  // level: 'main' | 'bodegas' | 'region'
  const [level, setLevel] = useState('main')
  const [activeRegion, setActiveRegion] = useState(null)

  function goRegion(r) {
    setActiveRegion(r)
    setLevel('region')
  }

  return (
    <div className="mobileMenuPanel">
      {/* ── Nivel principal ── */}
      {level === 'main' && (
        <>
          <div className="mobileMenuHeader">
            <h3>Menú</h3>
            <button onClick={onClose} className="mobileMenuClose" aria-label="Cerrar">✕</button>
          </div>
          <div className="mobileMenuScroll">
            <nav className="mobileMenuNav">
              {menu.map(m => (
                <NavLink key={m.to} to={m.to} className="mobileMenuItem" onClick={onLinkClick}>
                  {m.label}
                </NavLink>
              ))}
              {/* Entrada Bodegas con flecha */}
              <button
                className="mobileMenuItem mobileMenuItemArrow"
                onClick={() => setLevel('bodegas')}
              >
                BODEGAS
                <span className="mobileMenuArrow">›</span>
              </button>
            </nav>
            {!user && (
              <div className="mobileMenuAuth">
                <NavLink to="/login"    className="btn btnPrimary" onClick={onLinkClick} style={{ width: '100%', marginBottom: 8 }}>Iniciar sesión</NavLink>
                <NavLink to="/registro" className="btn"            onClick={onLinkClick} style={{ width: '100%' }}>Registrate</NavLink>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Nivel bodegas (lista de regiones) ── */}
      {level === 'bodegas' && (
        <>
          <div className="mobileMenuHeader mobileMenuHeaderSub">
            <button className="mobileMenuBack" onClick={() => setLevel('main')}>‹</button>
            <h3>BODEGAS</h3>
            <button onClick={onClose} className="mobileMenuClose" aria-label="Cerrar">✕</button>
          </div>
          <div className="mobileMenuScroll">
            <nav className="mobileMenuNav">
              <a
                href="/catalogo"
                className="mobileMenuItem mobileMenuItemSub"
                onClick={onLinkClick}
              >
                Ver todas las bodegas
              </a>
              {REGIONES.map(r => (
                <button
                  key={r.nombre}
                  className="mobileMenuItem mobileMenuItemArrow"
                  onClick={() => goRegion(r)}
                >
                  {r.nombre.toUpperCase()}
                  <span className="mobileMenuArrow">›</span>
                </button>
              ))}
              {/* Por tipo */}
              <div className="mobileMenuDivider" />
              {[
                { label: 'Vinos Tintos',  to: '/categoria/tinto'     },
                { label: 'Vinos Blancos', to: '/categoria/blanco'    },
                { label: 'Espumantes',    to: '/categoria/espumante' },
              ].map(l => (
                <NavLink key={l.to} to={l.to} className="mobileMenuItem mobileMenuItemSub" onClick={onLinkClick}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* ── Nivel región (bodegas de esa región) ── */}
      {level === 'region' && activeRegion && (
        <>
          <div className="mobileMenuHeader mobileMenuHeaderSub">
            <button className="mobileMenuBack" onClick={() => setLevel('bodegas')}>‹</button>
            <h3>{activeRegion.nombre.toUpperCase()}</h3>
            <button onClick={onClose} className="mobileMenuClose" aria-label="Cerrar">✕</button>
          </div>
          <div className="mobileMenuScroll">
            <nav className="mobileMenuNav">
              <a
                href={`/catalogo?region=${encodeURIComponent(activeRegion.nombre)}`}
                className="mobileMenuItem mobileMenuItemSub"
                onClick={onLinkClick}
              >
                Ver todo en {activeRegion.nombre}
              </a>
              <div className="mobileMenuDivider" />
              {activeRegion.bodegas.map(b => (
                <a
                  key={b.nombre}
                  href={wineryLink(b.nombre)}
                  className="mobileMenuItem"
                  onClick={onLinkClick}
                >
                  {b.nombre}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}

export default function Header() {
  const cart = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [activeAuth, setActiveAuth] = useState(null)
  const [headerConfig, setHeaderConfig] = useState(loadHeaderConfig)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const profileMenuRef = useRef(null)
  const searchDropdownRef = useRef(null)

  useEffect(() => {
    function onUpdate() { setHeaderConfig(loadHeaderConfig()) }
    window.addEventListener('rk_config_updated', onUpdate)
    return () => window.removeEventListener('rk_config_updated', onUpdate)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Bloquear scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showMobileMenu])

  // Búsqueda de vinos con autocompletado
  useEffect(() => {
    const searchWines = async () => {
      if (q.length >= 2) {
        try {
          const { searchWines: searchApi } = await import('../api/axiosDrinks.js')
          const results = await searchApi(q)
          setSearchResults(results)
          setShowSearchDropdown(true)
        } catch (error) {
          console.error('Error al buscar vinos:', error)
        }
      } else {
        setSearchResults([])
        setShowSearchDropdown(false)
      }
    }

    const debounceTimer = setTimeout(searchWines, 300)
    return () => clearTimeout(debounceTimer)
  }, [q])

  const menu = useMemo(
    () => [
      { to: '/', label: 'INICIO' },
      { to: '/categoria/tinto',     label: 'VINOS TINTOS'  },
      { to: '/categoria/blanco',    label: 'VINOS BLANCOS' },
      { to: '/categoria/espumante', label: 'ESPUMANTES'    },
    ],
    []
  )

  function onSubmit(e) {
    e.preventDefault()
    const value = String(q || '').trim()
    navigate('/catalogo', { state: { q: value } })
    setShowMobileSearch(false)
    setShowMobileMenu(false)
    setShowSearchDropdown(false)
  }

  function handleWineClick(wine) {
    navigate(`/vino/${wine.slug}`)
    setQ('')
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  function handleMobileLinkClick() {
    setShowMobileMenu(false)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="headerTop">
          {/* Buscador desktop */}
          <div style={{ position: 'relative' }} ref={searchDropdownRef}>
            <form className="headerSearch headerSearchDesktop" onSubmit={onSubmit}>
              <input
                className="headerSearchInput"
                placeholder="¿Qué estás buscando?"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="headerSearchBtn" type="submit" aria-label="Buscar">
                ⌕
              </button>
            </form>

            {/* Dropdown de resultados de búsqueda */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                marginTop: '8px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                border: '1px solid #e0e0e0'
              }}>
                {searchResults.map((wine) => (
                  <div
                    key={wine.id}
                    onClick={() => handleWineClick(wine)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f8f8'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#f5f5f5'
                    }}>
                      {wine.image ? (
                        <img
                          src={wine.image}
                          alt={wine.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          🍷
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {wine.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '2px'
                      }}>
                        {wine.bodega}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888'
                      }}>
                        {wine.cepa} • {wine.region}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#5a1f3f',
                      whiteSpace: 'nowrap'
                    }}>
                      ${wine.price?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logo - a la izquierda en móvil */}
          <NavLink to="/" className="headerLogo" aria-label="Ir al inicio">
            {headerConfig?.useLogoImage && headerConfig?.logoImage ? (
              <img
                src={headerConfig.logoImage}
                alt="Logo"
                style={{ height: 60, objectFit: 'contain' }}
              />
            ) : (
              <img
                src="/logo.png"
                alt="RK Vinos"
                style={{ height: 60, objectFit: 'contain' }}
              />
            )}
          </NavLink>

          {/* Botón búsqueda móvil - centro en móvil */}
          <button
            className="headerActionIcon headerSearchMobileBtn"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Buscar"
          >
            ⌕
          </button>

          {/* Acciones del header - derecha en móvil */}
          <div className="headerActions">
            {/* Asistente virtual */}
            <VirtualAssistant />

            {user ? (
              <>
                <NavLink to="/carrito" className="headerActionIcon" aria-label="Carrito">
                  🛒 <span className="headerCartCount">{cart.count}</span>
                </NavLink>
                
                <div 
                  style={{ position: 'relative', marginRight: '0' }}
                  ref={profileMenuRef}
                  className="headerProfileMenu"
                >
                  <div
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: user.profile_picture 
                        ? `url(${user.profile_picture}) center/cover` 
                        : 'linear-gradient(135deg, #5a1f3f 0%, #8b5a2b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    {!user.profile_picture && (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                  </div>

                  {showProfileMenu && (
                    <div className="profileDropdown">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          navigate('/perfil')
                        }}
                        className="profileDropdownItem"
                      >
                        👤 Editar perfil
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          logout()
                          navigate('/login')
                        }}
                        className="profileDropdownItem profileDropdownItemDanger"
                      >
                        🚪 Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>

                {/* Botón hamburguesa - solo visible en móvil, a la derecha */}
                <button 
                  className="headerMobileMenuBtn"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  aria-label="Menú"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="headerActionLink headerActionLinkDesktop"
                  onClick={() => setActiveAuth('login')}
                >
                  Iniciar sesión
                </NavLink>
                <NavLink
                  to="/registro"
                  className="headerActionLink headerActionLinkDesktop"
                  onClick={() => setActiveAuth('registro')}
                >
                  Registrate
                </NavLink>
                <NavLink to="/carrito" className="headerActionIcon" aria-label="Carrito">
                  🛒 <span className="headerCartCount">{cart.count}</span>
                </NavLink>

                {/* Botón hamburguesa - solo visible en móvil, a la derecha */}
                <button 
                  className="headerMobileMenuBtn"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  aria-label="Menú"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Buscador móvil desplegable */}
        {showMobileSearch && (
          <div className="headerSearchMobile">
            <form onSubmit={onSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="headerSearchInput"
                placeholder="¿Qué estás buscando?"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
              <button className="btn btnPrimary" type="submit">
                Buscar
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Menú de navegación desktop */}
      <div className="headerMenu headerMenuDesktop">
        <div className="container">
          <nav className="headerMenuNav" aria-label="Categorías">
            <NavLink to="/" className={linkClass}>INICIO</NavLink>
            <NavLink to="/catalogo" className={linkClass}>PRODUCTOS</NavLink>
            <NavLink to="/categoria/tinto"     className={linkClass}>VINOS TINTOS</NavLink>
            <NavLink to="/categoria/blanco"    className={linkClass}>VINOS BLANCOS</NavLink>
            <NavLink to="/categoria/espumante" className={linkClass}>ESPUMANTES</NavLink>
            <BodegasDropdown />
          </nav>
        </div>
      </div>

      {/* Menú móvil lateral - renderizado fuera del header usando Portal */}
      {showMobileMenu && createPortal(
        <>
          <div 
            className="mobileMenuOverlay"
            onClick={() => setShowMobileMenu(false)}
          />
          <MobileMenuPanel
            menu={menu}
            user={user}
            onClose={() => setShowMobileMenu(false)}
            onLinkClick={handleMobileLinkClick}
          />
        </>,
        document.body
      )}
    </header>
  )
}
