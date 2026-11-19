import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { id } = action
      const idKey = String(id)
      console.log('Cart ADD - id:', id, 'type:', typeof id, 'idKey:', idKey)
      const prevQty = state.items[idKey] || 0
      return {
        ...state,
        items: {
          ...state.items,
          [idKey]: prevQty + 1
        }
      }
    }
    case 'ADD_MANY': {
      const { id, quantity } = action
      const idKey = String(id)
      console.log('Cart ADD_MANY - id:', id, 'quantity:', quantity, 'idKey:', idKey)
      const prevQty = state.items[idKey] || 0
      return {
        ...state,
        items: {
          ...state.items,
          [idKey]: prevQty + quantity
        }
      }
    }
    case 'REMOVE_ONE': {
      const { id } = action
      const idKey = String(id)
      const prevQty = state.items[idKey] || 0
      if (prevQty <= 1) {
        const { [idKey]: _, ...rest } = state.items
        return { ...state, items: rest }
      }
      return {
        ...state,
        items: {
          ...state.items,
          [idKey]: prevQty - 1
        }
      }
    }
    case 'REMOVE_ALL': {
      const { id } = action
      const idKey = String(id)
      const { [idKey]: _, ...rest } = state.items
      return { ...state, items: rest }
    }
    case 'CLEAR':
      return { ...state, items: {} }
    default:
      return state
  }
}

const CART_STORAGE_KEY = 'rk-cart'

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { items: parsed.items || {} }
    }
  } catch (error) {
    console.error('Error al cargar carrito desde localStorage:', error)
  }
  return { items: {} }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, loadCartFromStorage())

  // Guardar en localStorage cada vez que cambie el estado
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error)
    }
  }, [state])

  const api = useMemo(() => {
    const count = Object.values(state.items).reduce((acc, n) => acc + n, 0)

    return {
      items: state.items,
      count,
      add: (id) => dispatch({ type: 'ADD', id }),
      addMany: (id, quantity) => dispatch({ type: 'ADD_MANY', id, quantity }),
      removeOne: (id) => dispatch({ type: 'REMOVE_ONE', id }),
      removeAll: (id) => dispatch({ type: 'REMOVE_ALL', id }),
      clear: () => dispatch({ type: 'CLEAR' })
    }
  }, [state.items])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
