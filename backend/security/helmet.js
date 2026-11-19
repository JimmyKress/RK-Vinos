import helmet from 'helmet'

export const securityHeaders = helmet({
  // Deshabilita X-Powered-By para no revelar información del servidor
  hidePoweredBy: true,

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-XSS-Protection
  xssFilter: true
})
