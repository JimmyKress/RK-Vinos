import dotenv from "dotenv";
dotenv.config();

// El antivirus/proxy intercepta TLS y reemplaza certificados en el entorno local.
// Esto afecta a fetch (SDK de Mercado Pago) y a nodemailer (SMTP Gmail).
// En producción con servidor real esto NO aplica — se controla con NODE_ENV.
if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from "./routes/drinksRoutes.js";
import {
  securityHeaders,
  generalLimit,
  authLimit,
  writeLimit,
  sanitizeInputs,
  sqlInjectionGuard
} from "./middleware/security.js";
import {
  limiter,
  authLimiter,
  corsConfig,
  sanitizeInput
} from "./security/index.js";

// Rutas desde variables de entorno
const ROUTE_AUTH = process.env.ROUTE_AUTH || '/auth';
const ROUTE_ADMIN = process.env.ROUTE_ADMIN || '/admin';
const ROUTE_ORDERS = process.env.ROUTE_ORDERS || '/orders';
const ROUTE_REVIEWS = process.env.ROUTE_REVIEWS || '/reviews';
const ROUTE_WINE_COMMENTS = process.env.ROUTE_WINE_COMMENTS || '/wine-comments';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = 3000;

// ── Seguridad ──────────────────────────────────────────
app.use(securityHeaders);

// ── CORS ───────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── Body parser ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Middlewares globales ───────────────────────────────
app.use(generalLimit);
app.use(sanitizeInputs);
app.use(sqlInjectionGuard);

// ── Rate limits por ruta sensible ──────────────────────
app.use(`${ROUTE_AUTH}/login`,           authLimit);
app.use(`${ROUTE_AUTH}/register`,        authLimit);
app.use(`${ROUTE_AUTH}/forgot-password`, authLimit);
app.use(`${ROUTE_ADMIN}/login`,          authLimit);
app.use(`${ROUTE_ADMIN}/register`,       authLimit);
app.use(ROUTE_ORDERS,                    writeLimit);
app.use(ROUTE_REVIEWS,                   writeLimit);
app.use(ROUTE_WINE_COMMENTS,             writeLimit);

// ── Rutas ──────────────────────────────────────────────
app.use("/", routes);
app.use('/charts', express.static(path.join(__dirname, 'public', 'charts')));

// ── Error handler global ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(port, () => {
  console.log(`\n Servidor iniciado en puerto ${port}`);
  //console.log(` Seguridad activa: Rate limiting · XSS protection · SQL injection guard · Security headers`);
});
