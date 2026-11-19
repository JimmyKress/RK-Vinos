import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logsDir = path.join(__dirname, '../logs')

// Crear carpeta de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const errorLogPath = path.join(logsDir, 'error.log')
const activityLogPath = path.join(logsDir, 'activity.log')
const suspiciousLogPath = path.join(logsDir, 'suspicious.log')

// Registrar errores
export function logError(message, error = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ERROR: ${message}\n${error ? error.stack : ''}\n\n`
  fs.appendFileSync(errorLogPath, logMessage)
  console.error(logMessage)
}

// Registrar actividades normales
export function logActivity(message, userId = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ACTIVITY: ${message}${userId ? ` (User: ${userId})` : ''}\n`
  fs.appendFileSync(activityLogPath, logMessage)
}

// Registrar actividades sospechosas
export function logSuspiciousActivity(message, ip = null, userId = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] SUSPICIOUS: ${message}${ip ? ` (IP: ${ip})` : ''}${userId ? ` (User: ${userId})` : ''}\n`
  fs.appendFileSync(suspiciousLogPath, logMessage)
  console.warn(logMessage)
}
