import cors from 'cors'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export const corsConfig = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
})
