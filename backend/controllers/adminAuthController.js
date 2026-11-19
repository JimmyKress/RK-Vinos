import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'drinksrk_db'
};

const SALT_ROUNDS = 10;
const ADMIN_DNI = process.env.ADMIN_DNI || '13279968';

// Registrar administrador (solo con DNI específico)
export const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, dni, password } = req.body;

    if (!fullName || !email || !dni || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Todos los campos son requeridos'
      });
    }

    // Verificar que el DNI sea el autorizado
    if (dni !== ADMIN_DNI) {
      return res.status(403).json({
        success: false,
        mensaje: 'No tienes autorización para registrarte como administrador'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verificar si el email ya existe
      const [existingAdmins] = await connection.execute(
        'SELECT id FROM admins WHERE email = ?',
        [email]
      );

      if (existingAdmins.length > 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'El email ya está registrado'
        });
      }

      // Verificar si ya existe un admin con ese DNI
      const [existingDNI] = await connection.execute(
        'SELECT id FROM admins WHERE dni = ?',
        [dni]
      );

      if (existingDNI.length > 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'Ya existe un administrador con ese DNI'
        });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insertar nuevo administrador
      const [result] = await connection.execute(
        'INSERT INTO admins (full_name, email, dni, password, created_at) VALUES (?, ?, ?, ?, NOW())',
        [fullName, email, dni, hashedPassword]
      );

      res.json({
        success: true,
        mensaje: 'Administrador registrado exitosamente',
        adminId: result.insertId
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    //console.error('Error al registrar administrador:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al registrar administrador',
      error: error.message
    });
  }
};

// Login de administrador
export const loginAdmin = async (req, res) => {
  try {
    const { email, dni, password } = req.body;

    if (!email || !dni || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email, DNI y contraseña son requeridos'
      });
    }

    // Verificar que el DNI sea el autorizado
    if (dni !== ADMIN_DNI) {
      return res.status(403).json({
        success: false,
        mensaje: 'DNI no autorizado'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Buscar administrador por email y DNI
      const [admins] = await connection.execute(
        'SELECT id, full_name, email, dni, password FROM admins WHERE email = ? AND dni = ?',
        [email, dni]
      );

      if (admins.length === 0) {
        return res.status(401).json({
          success: false,
          mensaje: 'Credenciales incorrectas'
        });
      }

      const admin = admins[0];

      // Verificar contraseña con bcrypt
      const passwordMatch = await bcrypt.compare(password, admin.password);
      
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          mensaje: 'Credenciales incorrectas'
        });
      }

      // Actualizar last_login y last_activity
      await connection.execute(
        'UPDATE admins SET last_login = NOW(), last_activity = NOW() WHERE id = ?',
        [admin.id]
      );

      res.json({
        success: true,
        mensaje: 'Login exitoso',
        admin: {
          id: admin.id.toString(),
          name: admin.full_name,
          email: admin.email,
          dni: admin.dni
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    //console.error('Error al hacer login de administrador:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Verificar contraseña del panel admin (primera capa)
export const verifyAdminPanelPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Contraseña es requerida'
      });
    }

    const ADMIN_PASS = process.env.ADMIN_PASS || 'rk2026';

    if (password === ADMIN_PASS) {
      res.json({
        success: true,
        mensaje: 'Contraseña correcta'
      });
    } else {
      res.status(401).json({
        success: false,
        mensaje: 'Contraseña incorrecta'
      });
    }

  } catch (error) {
    //console.error('Error al verificar contraseña del panel:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al verificar contraseña',
      error: error.message
    });
  }
};
