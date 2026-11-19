import { useEffect, useRef, useState } from 'react'

export function useReveal(options = {}) {
  const { rootMargin = '0px 0px -10% 0px', threshold = 0.12, once = true } = options

  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { root: null, rootMargin, threshold }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin, threshold, once])

  return { ref, visible }
}
