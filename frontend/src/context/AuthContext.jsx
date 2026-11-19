import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { updateUserActivity, markUserOffline } from '../api/axiosDrinks'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const heartbeatIntervalRef = useRef(null)

  useEffect(() => {
    // Cargar usuario del localStorage al iniciar
    try {
      const savedUser = localStorage.getItem('rk_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Efecto para manejar el heartbeat cuando el usuario está logueado
  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    // Si hay un usuario logueado, iniciar heartbeat
    if (user && user.id) {
      // Enviar heartbeat inmediatamente
      sendHeartbeat(user.id)

      // Configurar heartbeat cada 2 minutos (120000ms)
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat(user.id)
      }, 120000) // 2 minutos

      // También enviar heartbeat cuando la ventana vuelve a estar visible
      const handleVisibilityChange = () => {
        if (!document.hidden && user && user.id) {
          sendHeartbeat(user.id)
        }
      }

      // Marcar como offline cuando el usuario cierra la pestaña/navegador
      const handleBeforeUnload = () => {
        if (user && user.id) {
          // Usar fetch con keepalive para garantizar que la petición se complete
          fetch('http://localhost:3000/users/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
            keepalive: true // Permite que la petición se complete incluso después de cerrar la página
          }).catch(err => console.error('Error al marcar offline:', err))
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('beforeunload', handleBeforeUnload)
      // También capturar cuando se cierra la pestaña con pagehide (más confiable en algunos navegadores)
      window.addEventListener('pagehide', handleBeforeUnload)

      // Cleanup
      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('pagehide', handleBeforeUnload)
      }
    }
  }, [user])

  const sendHeartbeat = async (userId) => {
    try {
      await updateUserActivity(userId)
      //console.log('💓 Heartbeat enviado')
    } catch (error) {
      console.error('Error al enviar heartbeat:', error)
    }
  }

  const login = (userData) => {
    setUser(userData)
    try {
      localStorage.setItem('rk_user', JSON.stringify(userData))
    } catch (error) {
      console.error('Error al guardar usuario:', error)
    }
  }

  const logout = async () => {
    // Marcar usuario como offline antes de limpiar la sesión
    if (user && user.id) {
      try {
        await markUserOffline(user.id)
        console.log('✓ Usuario marcado como offline')
      } catch (error) {
        console.error('Error al marcar usuario offline:', error)
      }
    }

    setUser(null)
    try {
      localStorage.removeItem('rk_user')
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
    }
    // Limpiar heartbeat al cerrar sesión
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
    try {
      localStorage.setItem('rk_user', JSON.stringify({ ...user, ...userData }))
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
