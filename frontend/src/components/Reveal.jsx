import React from 'react'
import { useReveal } from '../hooks/useReveal.js'

export default function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  delay = 0,
  y = 14
}) {
  const { ref, visible } = useReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'revealVisible' : ''} ${className}`}
      style={{
        '--reveal-delay': `${delay}ms`,
        '--reveal-y': `${y}px`
      }}
    >
      {children}
    </Tag>
  )
}
