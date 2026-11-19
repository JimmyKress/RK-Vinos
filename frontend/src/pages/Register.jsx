import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'

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

// Componente para mostrar cada requisito de contraseña
function RequirementItem({ met, children }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      fontSize: 13,
      color: met ? '#00c853' : '#666',
      transition: 'color 0.2s'
    }}>
      <span style={{ fontWeight: 'bold', fontSize: 16 }}>
        {met ? '✓' : '✗'}
      </span>
      <span>{children}</span>
    </div>
  )
}

// Función de validación de contraseña
function validatePassword(password) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[@#./]/.test(password)
  }
}

export default function Register() {
  const navigate = useNavigate()
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false
  })
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [touchedConfirm, setTouchedConfirm] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    
    // Validar teléfono
    if (name === 'phone') {
      // Solo permitir números
      const phoneValue = value.replace(/\D/g, '')
      const fullPhone = '+54 ' + phoneValue
      
      // Validar longitud (sin +54 debe tener 10 dígitos para Argentina)
      if (phoneValue.length > 0 && phoneValue.length !== 10) {
        setPhoneError('El teléfono debe tener 10 dígitos (ej: 3815293658)')
      } else {
        setPhoneError('')
      }
    }
    
    // Validar contraseña en tiempo real
    if (name === 'password') {
      setPasswordValidation(validatePassword(value))
      // Si ya tocó el campo de confirmación, validar coincidencia
      if (touchedConfirm) {
        setPasswordsMatch(value === form.confirmPassword)
      }
    }
    
    // Validar coincidencia cuando escribe en confirmación
    if (name === 'confirmPassword' && touchedConfirm) {
      setPasswordsMatch(form.password === value)
    }
  }

  function onBlurConfirmPassword() {
    setTouchedConfirm(true)
    setPasswordsMatch(form.password === form.confirmPassword)
  }

  function onSubmit(e) {
    e.preventDefault()
    
    // Validar campos obligatorios
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }
    
    // Validar teléfono (debe tener 10 dígitos)
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setPhoneError('El teléfono debe tener 10 dígitos (ej: 3815293658)')
      alert('El teléfono debe tener 10 dígitos')
      return
    }
    
    // Marcar como tocado para mostrar errores
    setTouchedConfirm(true)
    
    // Validar que las contraseñas coincidan
    if (form.password !== form.confirmPassword) {
      setPasswordsMatch(false)
      alert('Las contraseñas no coinciden')
      return
    }
    
    // Validar todos los requisitos de contraseña
    const validation = validatePassword(form.password)
    const allRequirementsMet = Object.values(validation).every(Boolean)
    
    if (!allRequirementsMet) {
      alert('La contraseña no cumple con todos los requisitos de seguridad')
      return
    }
    
    // Todo válido - mostrar modal de términos y condiciones
    setShowTermsModal(true)
  }

  function handleAcceptTerms() {
    // Enviar código de verificación después de aceptar términos
    const handleSendCode = async (e) => {
      e.preventDefault()
      setError('')
      setSendingCode(true)

      const ROUTE_AUTH = import.meta.env.VITE_ROUTE_AUTH || '/auth'

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${ROUTE_AUTH}/send-verification-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            fullName: `${name} ${lastName}`
          })
        })
        const data = await response.json()

        if (data.success) {
          // Navegar a la página de verificación
          navigate('/verificar-codigo', {
            state: {
              email: form.email,
              fullName: form.fullName,
              password: form.password,
              phone: form.phone
            }
          })
        } else {
          alert('Error al enviar el código: ' + data.mensaje)
          setShowTermsModal(false)
        }
      } catch (error) {
        console.error('Error al enviar código:', error)
        alert('Error de conexión. Intenta nuevamente.')
        setShowTermsModal(false)
      } finally {
        setSendingCode(false)
      }
    }

    handleSendCode()
  }

  function handleDeclineTerms() {
    setShowTermsModal(false)
  }

  // Validar si el formulario completo es válido
  const isFormValid = useMemo(() => {
    const allRequirementsMet = Object.values(passwordValidation).every(Boolean)
    const passwordsOk = form.password === form.confirmPassword && form.confirmPassword.length > 0
    const requiredFieldsFilled = form.fullName.trim() && form.email.trim() && form.phone.trim()
    const phoneValid = form.phone.replace(/\D/g, '').length === 10
    return allRequirementsMet && passwordsOk && requiredFieldsFilled && phoneValid
  }, [form, passwordValidation])

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showTermsModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showTermsModal])

  return (
    <div className="container authPage">
      <Reveal as="section" className="card authCard">
        <div className="authHeader">
          <h1>Registro</h1>
          <p className="muted">Creá tu cuenta para comprar más rápido.</p>
        </div>

        <form className="authForm" onSubmit={onSubmit}>
          <label>
            Nombre de usuario
            <input
              className="input"
              name="fullName"
              placeholder="Ej.: Juan Pérez"
              value={form.fullName}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Email
            <input
              className="input"
              name="email"
              type="text"
              placeholder="Ej.: correo@ejemplo.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Teléfono
            <div className="inputEyeWrap" style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                +54
              </span>
              <input
                className="input"
                name="phone"
                inputMode="tel"
                placeholder="3815293658"
                value={form.phone}
                onChange={onChange}
                required
                maxLength={10}
                style={{
                  paddingLeft: '45px'
                }}
              />
            </div>
            {phoneError && (
              <div style={{
                marginTop: '6px',
                fontSize: '13px',
                color: '#e74c3c',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '16' }}>⚠</span>
                <span>{phoneError}</span>
              </div>
            )}
          </label>

          <label>
            Contraseña
            <div className="inputEyeWrap">
              <input
                className="input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ej.: tucontraseña"
                value={form.password}
                onChange={onChange}
                required
                style={{
                  paddingRight: touchedConfirm && form.password && form.confirmPassword ? '80px' : '50px'
                }}
              />
              {/* Icono de validación de coincidencia */}
              {touchedConfirm && form.password && form.confirmPassword && (
                <span style={{
                  position: 'absolute',
                  right: '45px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: passwordsMatch ? '#00c853' : '#e74c3c',
                  pointerEvents: 'none'
                }}>
                  {passwordsMatch ? '✓' : '✗'}
                </span>
              )}
              <button
                type="button"
                className="inputEyeBtn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            
            {/* Lista de requisitos de contraseña */}
            <div style={{ 
              marginTop: 8, 
              padding: 12, 
              background: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 6,
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#666' }}>
                Requisitos de contraseña:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <RequirementItem met={passwordValidation.minLength}>
                  Mínimo 8 caracteres
                </RequirementItem>
                <RequirementItem met={passwordValidation.hasUppercase}>
                  Una letra mayúscula
                </RequirementItem>
                <RequirementItem met={passwordValidation.hasNumber}>
                  Un número
                </RequirementItem>
                <RequirementItem met={passwordValidation.hasSpecial}>
                  Un carácter especial (@ # . /)
                </RequirementItem>
              </div>
            </div>
          </label>

          <label>
            Repetir contraseña
            <div className="inputEyeWrap">
              <input
                className="input"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmá tu contraseña"
                value={form.confirmPassword}
                onChange={onChange}
                onBlur={onBlurConfirmPassword}
                required
                style={{
                  paddingRight: touchedConfirm && form.confirmPassword ? '80px' : '50px'
                }}
              />
              {/* Icono de validación de coincidencia */}
              {touchedConfirm && form.confirmPassword && (
                <span style={{
                  position: 'absolute',
                  right: '45px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: passwordsMatch ? '#00c853' : '#e74c3c',
                  pointerEvents: 'none'
                }}>
                  {passwordsMatch ? '✓' : '✗'}
                </span>
              )}
              <button
                type="button"
                className="inputEyeBtn"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            
            {/* Mensaje de error si las contraseñas no coinciden */}
            {touchedConfirm && !passwordsMatch && form.confirmPassword.length > 0 && (
              <div style={{ 
                marginTop: 6, 
                fontSize: 13, 
                color: '#e74c3c',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 16 }}>✗</span>
                <span>Las contraseñas no coinciden</span>
              </div>
            )}
          </label>

          <button 
            className="btn btnPrimary" 
            type="submit"
            disabled={!isFormValid}
            style={{ 
              opacity: isFormValid ? 1 : 0.6,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s'
            }}
          >
            Registrarme
          </button>
        </form>

        <div className="authFooter muted">
          ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
        </div>
      </Reveal>

      {/* Modal de Términos y Condiciones */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header del modal */}
            <div style={{
              padding: '32px 32px 24px 32px',
              borderBottom: '2px solid #5a1f3f',
              backgroundColor: '#faf8f5',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#5a1f3f',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                RK Vinos
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: '#2c1810',
                fontFamily: 'Georgia, serif'
              }}>
                Términos y Condiciones
              </h2>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '13px',
                color: '#666',
                fontStyle: 'italic'
              }}>
                Última actualización: Octubre 2026
              </p>
            </div>

            {/* Contenido con scroll */}
            <div style={{
              padding: '32px',
              overflowY: 'auto',
              flex: 1,
              fontSize: '13px',
              lineHeight: '1.8',
              color: '#2c1810',
              fontFamily: 'Georgia, serif',
              backgroundColor: '#ffffff'
            }}>
              <div style={{
                marginBottom: '28px',
                padding: '20px',
                backgroundColor: '#faf8f5',
                borderLeft: '3px solid #5a1f3f',
                fontStyle: 'italic'
              }}>
                Estos Términos y Condiciones regulan el acceso y uso del sitio web de RK Vinos y la adquisición de productos a través del mismo. Al utilizar el sitio y/o realizar una compra, usted declara haber leído, comprendido y aceptado estos Términos en su totalidad.
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  1. Aceptación de los Términos
                </div>
                <div style={{ textAlign: 'justify' }}>
                  El uso del sitio web y la realización de cualquier compra implican la aceptación plena y sin reservas de estos Términos y Condiciones, así como de las políticas de privacidad y de envíos. Si no está de acuerdo con alguna de las disposiciones, le solicitamos que no utilice el sitio ni realice compras.

                  RK Vinos se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigencia a partir de su publicación en el sitio. El uso continuado del sitio después de la publicación de los cambios constituirá aceptación de los mismos.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  2. Información sobre la empresa y contacto
                </div>
                <div style={{ textAlign: 'justify' }}>
                  RK Vinos es una tienda online dedicada a la comercialización de vinos argentinos.

                  Para cualquier consulta, reclamo o comunicación, puede contactarnos a través de:
                  <ul style={{ marginTop: '10px', marginLeft: '20px', listStyleType: 'disc' }}>
                    <li>Correo electrónico: info@rkvinos.com.ar</li>
                    <li>Teléfono / WhatsApp: 3815293658</li>
                  </ul>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  3. Registro de usuarios y cuenta
                </div>
                <div style={{ textAlign: 'justify' }}>
                  Para realizar compras no es obligatorio crear una cuenta, aunque se recomienda para facilitar el seguimiento de pedidos y acceder a beneficios.

                  Al registrarse, el usuario se compromete a:
                  <ul style={{ marginTop: '10px', marginLeft: '20px', listStyleType: 'disc' }}>
                    <li>Proporcionar información veraz, completa y actualizada.</li>
                    <li>Mantener la confidencialidad de su contraseña y ser responsable de todas las actividades realizadas desde su cuenta.</li>
                    <li>Notificar de inmediato cualquier uso no autorizado de su cuenta.</li>
                  </ul>

                  RK Vinos se reserva el derecho de suspender o cancelar cuentas que contengan información falsa, o que se utilicen de manera fraudulenta o contraria a estos Términos.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  4. Productos y precios
                </div>
                <div style={{ textAlign: 'justify' }}>
                  Los productos ofrecidos son vinos de origen argentino. Las descripciones, imágenes y características publicadas tienen carácter informativo. Nos esforzamos por que la información sea precisa, aunque pueden existir variaciones menores propias del producto natural.

                  Todos los precios se expresan en pesos argentinos (ARS) e incluyen el Impuesto al Valor Agregado (IVA) cuando corresponda, salvo indicación en contrario. Los precios pueden modificarse en cualquier momento sin previo aviso, aplicándose el precio vigente al momento de la confirmación del pedido.

                  Las ofertas y promociones tienen vigencia limitada y están sujetas a stock disponible.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  5. Proceso de compra y pago
                </div>
                <div style={{ textAlign: 'justify' }}>
                  El proceso de compra se realiza a través del sitio web siguiendo los pasos indicados. Una vez confirmado el pedido y verificado el pago, se enviará un correo electrónico de confirmación.

                  <strong>Medios de pago:</strong> Únicamente a través de Mercado Pago, aceptándose todas las tarjetas habilitadas por dicha plataforma. El procesamiento del pago se realiza de forma segura a través de Mercado Pago. RK Vinos no almacena datos de tarjetas de crédito o débito.

                  La compra se considera perfeccionada una vez que el pago haya sido acreditado y aceptado por el sistema. En caso de rechazo del pago, el pedido quedará automáticamente cancelado.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  6. Política de envíos y tiempos de entrega
                </div>
                <div style={{ textAlign: 'justify' }}>
                  Los envíos son gratuitos a todo el territorio de la República Argentina, con excepción de:
                  <ul style={{ marginTop: '10px', marginLeft: '20px', listStyleType: 'disc' }}>
                    <li>Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur</li>
                    <li>Localidades de Comodoro Rivadavia y Rada Tilly (Provincia de Chubut)</li>
                  </ul>

                  <strong>Entrega express:</strong> En las zonas habilitadas, se ofrece entrega en un plazo estimado de 24 horas hábiles (de lunes a viernes, excluyendo feriados nacionales), sujeto a disponibilidad logística y confirmación del pedido antes del horario de corte establecido.

                  Los plazos de entrega son estimativos y pueden verse afectados por factores ajenos a RK Vinos (condiciones climáticas, demoras de terceros, fuerza mayor, etc.). Una vez despachado el pedido, el cliente recibirá el número de seguimiento correspondiente.

                  El cliente es responsable de proporcionar una dirección de entrega correcta y completa, así como de estar presente o designar a una persona autorizada para recibir el pedido. En caso de devolución por dirección incorrecta o ausencia reiterada, los costos de reenvío podrán ser a cargo del cliente.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  7. Devoluciones y cambios
                </div>
                <div style={{ textAlign: 'justify' }}>
                  De conformidad con la Ley de Defensa del Consumidor (Ley 24.240) y normativa aplicable, el cliente tiene derecho a arrepentirse de la compra dentro de los 10 (diez) días corridos contados a partir de la recepción del producto, siempre que el mismo se encuentre en perfectas condiciones, sin haber sido abierto ni consumido, y con su embalaje original.

                  Para ejercer el derecho de arrepentimiento o solicitar un cambio por producto defectuoso, el cliente deberá contactarnos a través de los canales indicados en el punto 2, indicando el número de pedido y el motivo.

                  Los productos que presenten defectos de fabricación o deterioro imputable al transporte serán reemplazados o reembolsados, según corresponda, previa verificación.

                  No se aceptarán devoluciones de productos abiertos, consumidos parcial o totalmente, o que presenten signos de manipulación indebida, salvo en los casos de defectos de calidad debidamente acreditados.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  8. Responsabilidades del cliente
                </div>
                <div style={{ textAlign: 'justify' }}>
                  El cliente se obliga a:
                  <ul style={{ marginTop: '10px', marginLeft: '20px', listStyleType: 'disc' }}>
                    <li>Verificar que la información de envío y facturación sea correcta.</li>
                    <li>Recibir el pedido en el domicilio indicado o designar a una persona mayor de 18 años para su recepción.</li>
                    <li>Verificar el estado del paquete al momento de la entrega y rechazarlo si presenta daños evidentes, dejando constancia ante el transportista.</li>
                    <li>Utilizar los productos de manera responsable y conforme a la legislación vigente.</li>
                  </ul>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  9. Propiedad intelectual
                </div>
                <div style={{ textAlign: 'justify' }}>
                  Todo el contenido del sitio web (textos, imágenes, logotipos, diseños, fotografías, marcas, etc.) es propiedad de RK Vinos o de terceros que han autorizado su uso, y se encuentra protegido por las leyes de propiedad intelectual argentinas e internacionales.

                  Queda prohibida la reproducción, distribución, modificación o uso comercial de cualquier contenido del sitio sin autorización previa y por escrito de RK Vinos.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  10. Protección de datos personales
                </div>
                <div style={{ textAlign: 'justify' }}>
                  El tratamiento de los datos personales se realiza de conformidad con la Ley 25.326 de Protección de Datos Personales y su normativa complementaria.

                  Los datos proporcionados por el usuario serán utilizados exclusivamente para la gestión de pedidos, facturación, envíos, atención al cliente y, en caso de consentimiento expreso, para el envío de comunicaciones comerciales.

                  El titular de los datos podrá ejercer en cualquier momento los derechos de acceso, rectificación, actualización y supresión de sus datos, contactándonos a través de los canales indicados en el punto 2.

                  Para más información, consulte nuestra Política de Privacidad.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  11. Limitación de responsabilidad
                </div>
                <div style={{ textAlign: 'justify' }}>
                  RK Vinos no será responsable por:
                  <ul style={{ marginTop: '10px', marginLeft: '20px', listStyleType: 'disc' }}>
                    <li>Daños o perjuicios derivados del uso indebido de los productos.</li>
                    <li>Retrasos o incumplimientos causados por caso fortuito, fuerza mayor o hechos de terceros (transportistas, proveedores de pago, etc.).</li>
                    <li>Contenidos o servicios de terceros a los que se acceda a través de enlaces del sitio.</li>
                  </ul>

                  En ningún caso la responsabilidad de RK Vinos excederá el valor del producto adquirido que originó el reclamo.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  12. Modificación de los Términos
                </div>
                <div style={{ textAlign: 'justify' }}>
                  RK Vinos podrá modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán publicadas en el sitio web y entrarán en vigencia desde su publicación. Se recomienda revisar periódicamente esta sección.
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#5a1f3f',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #e8e0d8',
                  fontFamily: 'Georgia, serif'
                }}>
                  13. Jurisdicción y leyes aplicables
                </div>
                <div style={{ textAlign: 'justify' }}>
                  Estos Términos se rigen por las leyes de la República Argentina. Cualquier controversia que derive de la interpretación o aplicación de estos Términos será sometida a los tribunales ordinarios competentes de la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero o jurisdicción.
                </div>
              </div>

              <div style={{ 
                marginTop: '32px', 
                padding: '24px',
                backgroundColor: '#fff8e1',
                border: '2px solid #d4a574',
                borderRadius: '4px',
                fontWeight: '600',
                color: '#8b4513',
                textAlign: 'center',
                fontFamily: 'Georgia, serif'
              }}>
                <div style={{
                  fontSize: '16px',
                  marginBottom: '12px',
                  color: '#8b4513'
                }}>
                  14. Prohibición de venta a menores y consumo responsable
                </div>
                <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                  Queda terminantemente prohibida la venta de bebidas alcohólicas a menores de 18 años.
                </div>
                <div style={{ fontSize: '13px', textAlign: 'justify', marginBottom: '12px' }}>
                  Al realizar una compra, el cliente declara bajo juramento ser mayor de 18 años y que la persona que recibirá el pedido también lo es. RK Vinos se reserva el derecho de solicitar documentación que acredite la edad en cualquier momento del proceso de compra o entrega. En caso de detectarse una compra realizada por un menor, la misma será cancelada y se procederá a la devolución del importe abonado, sin derecho a reclamo alguno.
                </div>
                <div style={{ fontSize: '14px', fontStyle: 'italic' }}>
                  Beba con moderación. El consumo de alcohol en exceso es perjudicial para la salud. Está prohibida la venta de bebidas alcohólicas a menores de 18 años (Ley 24.788 y normativa complementaria).
                </div>
              </div>
            </div>

            {/* Footer con checkbox y botones */}
            <div style={{
              padding: '24px 32px',
              borderTop: '2px solid #5a1f3f',
              backgroundColor: '#faf8f5',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#2c1810',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{
                    marginTop: '2px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#5a1f3f'
                  }}
                />
                <span>
                  He leído, comprendido y acepto los Términos y Condiciones de uso y compra de RK Vinos. Declaro ser mayor de 18 años.
                </span>
              </label>

              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end'
              }}>
                <button
                  className="btn"
                  onClick={handleDeclineTerms}
                  style={{
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'Georgia, serif',
                    backgroundColor: '#e8e0d8',
                    color: '#2c1810',
                    border: '1px solid #d4c4b4'
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btnPrimary"
                  onClick={handleAcceptTerms}
                  disabled={!termsAccepted || sendingCode}
                  style={{
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'Georgia, serif',
                    backgroundColor: '#5a1f3f',
                    border: '1px solid #5a1f3f',
                    opacity: (!termsAccepted || sendingCode) ? 0.6 : 1,
                    cursor: (!termsAccepted || sendingCode) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {sendingCode ? '📧 Enviando código...' : '✓ Aceptar y continuar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
