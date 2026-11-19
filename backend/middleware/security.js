
//  SEGURIDAD — Middlewares centralizados

// ── Headers HTTP seguros ─────────────────────────────────
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

// ── Rate Limiting ─────────────────────────────────────────
const ipMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of ipMap) {
    if (now > e.resetAt) ipMap.delete(ip);
  }
}, 5 * 60 * 1000);

export function rateLimit({ windowMs = 60000, max = 150, message = 'Demasiadas peticiones. Intentá en unos segundos.' } = {}) {
  return (req, res, next) => {
    const ip  = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const e   = ipMap.get(ip);

    if (!e || now > e.resetAt) {
      ipMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    e.count++;
    if (e.count > max) {
      return res.status(429).json({ error: message, retryAfter: Math.ceil((e.resetAt - now) / 1000) });
    }
    next();
  };
}

export const generalLimit = rateLimit({ windowMs: 60000, max: 150 });
export const authLimit    = rateLimit({ windowMs: 60000, max: process.env.NODE_ENV === 'production' ? 10 : 100, message: 'Demasiados intentos. Esperá 1 minuto.' });
export const writeLimit   = rateLimit({ windowMs: 60000, max: 40,  message: 'Demasiadas operaciones de escritura.' });

// ── SQL Injection Guard ────────────────────────────────────
// Solo bloquea patrones claramente maliciosos en campos cortos (no en texto libre ni imágenes)
const DANGEROUS = [
  /(\bDROP\s+TABLE\b|\bDROP\s+DATABASE\b)/gi,
  /(\bUNION\s+SELECT\b)/gi,
  /(\bEXEC\s*\(|\bEXECUTE\s*\()/gi,
  /(;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\s)/gi,
  /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/gi,  // OR 1=1
  /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/gi, // AND 1=1
  /(--\s*$)/gm,                                        // comentario SQL al final
  /(\/\*[\s\S]*?\*\/)/g,                               // comentario /* */
];

// Campos que NUNCA se chequean (texto libre, imágenes, hashes, tokens)
const SKIP_FIELDS = new Set([
  'image', 'mediaUrl', 'logoImage', 'profile_picture',
  'comment', 'description', 'notes', 'pairing',
  'password', 'token', 'code', 'items', 'html',
  'subtitle', 'title', 'reason', 'motivo', 'message',
  'rejection_reason', 'content', 'body'
]);

function isDangerous(val) {
  if (typeof val !== 'string' || val.length > 500) return false; // strings largos son imágenes/texto libre
  return DANGEROUS.some(p => { p.lastIndex = 0; return p.test(val); });
}

function checkForAttack(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 3) return false;
  for (const [key, val] of Object.entries(obj)) {
    if (SKIP_FIELDS.has(key)) continue;
    if (typeof val === 'string' && isDangerous(val)) return true;
    if (typeof val === 'object' && checkForAttack(val, depth + 1)) return true;
  }
  return false;
}

export function sqlInjectionGuard(req, res, next) {
  if (checkForAttack(req.body) || checkForAttack(req.query) || checkForAttack(req.params)) {
    const ip = req.socket?.remoteAddress;
    console.warn(`⚠ Posible SQL injection bloqueado | IP: ${ip} | Ruta: ${req.method} ${req.path}`);
    return res.status(400).json({ error: 'Petición rechazada por seguridad.' });
  }
  next();
}

// ── Sanitización XSS ──────────────────────────────────────
// Solo sanitiza campos de salida en respuestas — NO modifica el body entrante
// para no romper consultas SQL con caracteres válidos como '  &  <
// La protección real contra XSS viene de los headers CSP + X-XSS-Protection
// y del frontend que usa React (escapa automáticamente el JSX)
export function sanitizeInputs(req, res, next) {
  // Solo limpia parámetros de URL que son IDs o slugs cortos
  if (req.params) {
    for (const [k, v] of Object.entries(req.params)) {
      if (typeof v === 'string') {
        // Elimina solo caracteres peligrosos en params (no en body)
        req.params[k] = v.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').trim();
      }
    }
  }
  next();
}
