import { xss } from 'express-xss-sanitizer'

// Configuración de sanitización XSS
export const sanitizeInput = xss({
  // Lista blanca de etiquetas HTML permitidas (si es necesario)
  whiteList: {
    // Por defecto, no permitimos ninguna etiqueta HTML
    // Si necesitas permitir algunas, agrégalas aquí
  },

  // Opciones de limpieza
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
})

// Middleware adicional para sanitizar query y params
export function sanitizeRequest(req, res, next) {
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body))
  }
  if (req.query) {
    req.query = JSON.parse(JSON.stringify(req.query))
  }
  if (req.params) {
    req.params = JSON.parse(JSON.stringify(req.params))
  }
  next()
}
