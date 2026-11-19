import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Configuración de la conexión a la base de datos desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'drinksrk_db'
};

// Número de salt rounds para bcrypt (más alto = más seguro pero más lento)
const SALT_ROUNDS = 10;

// Almacenamiento temporal de códigos de verificación (en producción usar Redis o DB)
const verificationCodes = new Map();

// Almacenamiento temporal de tokens de recuperación de contraseña
const passwordResetTokens = new Map();

// Configurar nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  // Forzar IPv4 para evitar problemas con ::1 (IPv6)
  family: 4,
  // Opciones adicionales para Gmail
  tls: {
    rejectUnauthorized: false
  }
});

// Generar código de 4 dígitos
function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Enviar código de verificación por email
export const sendVerificationCode = async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Email y nombre completo son requeridos' 
      });
    }

    // Verificar configuración de email
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
      //console.error('Variables de entorno de email no configuradas');
      return res.status(500).json({
        success: false,
        mensaje: 'Configuración de email no disponible'
      });
    }


    // Generar código de 4 dígitos
    const code = generateVerificationCode();

    // Guardar código temporalmente (expira en 10 minutos)
    verificationCodes.set(email, {
      code,
      timestamp: Date.now(),
      attempts: 0
    });

    // Configurar email
    const mailOptions = {
      from: `"RK Vinos" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Código de verificación - RK Vinos',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
              color: #ffffff;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .content p {
              color: #333;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .code-box {
              background-color: #f9f9f9;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .code {
              font-size: 48px;
              font-weight: 700;
              color: #667eea;
              letter-spacing: 8px;
              margin: 0;
            }
            .button {
              display: inline-block;
              background-color: #667eea;
              color: #ffffff;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: background-color 0.3s;
            }
            .button:hover {
              background-color: #5568d3;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #e0e0e0;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px 16px;
              margin: 20px 0;
              font-size: 14px;
              color: #856404;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍷 RK Vinos</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">¡Hola, ${fullName}!</h2>
              <p>Gracias por registrarte en RK Vinos. Para completar tu registro, utiliza el siguiente código de verificación:</p>
              
              <div class="code-box">
                <p class="code">${code}</p>
              </div>
              
              <p>Este código es válido por <strong>10 minutos</strong>.</p>
              
              <p>O hacé click en el siguiente botón para ir directamente a la página de verificación:</p>
              
              <a href="http://localhost:5173/verificar-codigo" class="button">Ingresar Código de Verificación</a>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Si no solicitaste este registro, ignora este correo. Tu información está segura.
              </div>
              
              <p style="margin-top: 30px; color: #666;">¿Necesitas ayuda? Contactanos en cualquier momento.</p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© ${new Date().getFullYear()} RK Vinos. Todos los derechos reservados.</p>
              <p style="margin: 5px 0 0 0;">Este correo fue enviado a ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      mensaje: 'Código de verificación enviado al correo electrónico'
    });

  } catch (error) {
    console.error('❌ Error al enviar código de verificación:', error);
    console.error('Detalles del error:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al enviar el código de verificación. Por favor, verifica tu conexión e intenta nuevamente.',
      error: error.message,
      errorCode: error.code
    });
  }
};

// Verificar código y registrar usuario
export const verifyCodeAndRegister = async (req, res) => {
  try {
    const { email, code, fullName, password, phone } = req.body;

    if (!email || !code || !fullName || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email, código, nombre y contraseña son requeridos'
      });
    }

    // Verificar si existe el código
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        mensaje: 'Código no encontrado o expirado'
      });
    }

    // Verificar si el código expiró (10 minutos)
    const currentTime = Date.now();
    const expirationTime = 10 * 60 * 1000; // 10 minutos en milisegundos

    if (currentTime - storedData.timestamp > expirationTime) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        mensaje: 'El código ha expirado. Solicita uno nuevo.'
      });
    }

    // Verificar intentos (máximo 3)
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        mensaje: 'Demasiados intentos fallidos. Solicita un nuevo código.'
      });
    }

    // Verificar código
    if (storedData.code !== code) {
      storedData.attempts += 1;
      verificationCodes.set(email, storedData);
      
      return res.status(400).json({
        success: false,
        mensaje: `Código incorrecto. Intentos restantes: ${3 - storedData.attempts}`
      });
    }

    // Código correcto - Registrar usuario en la base de datos
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verificar si el email ya existe
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'El email ya está registrado'
        });
      }

      // Hashear la contraseña con bcrypt
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insertar nuevo usuario con contraseña hasheada
      const [result] = await connection.execute(
        'INSERT INTO users (full_name, email, phone, password, created_at, verified) VALUES (?, ?, ?, ?, NOW(), 1)',
        [fullName, email, phone || null, hashedPassword]
      );

      // Eliminar código de verificación usado
      verificationCodes.delete(email);

      res.json({
        success: true,
        mensaje: 'Registro completado exitosamente',
        userId: result.insertId
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al verificar código y registrar:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al completar el registro',
      error: error.message
    });
  }
};

// Reenviar código de verificación
export const resendVerificationCode = async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email y nombre son requeridos'
      });
    }

    // Eliminar código anterior si existe
    verificationCodes.delete(email);

    // Generar nuevo código
    const code = generateVerificationCode();

    // Guardar nuevo código
    verificationCodes.set(email, {
      code,
      timestamp: Date.now(),
      attempts: 0
    });

    // Configurar email
    const mailOptions = {
      from: `"RK Vinos" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Nuevo código de verificación - RK Vinos',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
              color: #ffffff;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .code-box {
              background-color: #f9f9f9;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .code {
              font-size: 48px;
              font-weight: 700;
              color: #667eea;
              letter-spacing: 8px;
              margin: 0;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍷 RK Vinos</h1>
            </div>
            <div class="content">
              <h2 style="color: #333;">Nuevo código de verificación</h2>
              <p>Solicitaste un nuevo código. Aquí está:</p>
              
              <div class="code-box">
                <p class="code">${code}</p>
              </div>
              
              <p>Este código es válido por <strong>10 minutos</strong>.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RK Vinos. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      mensaje: 'Nuevo código enviado al correo electrónico'
    });

  } catch (error) {
    console.error('Error al reenviar código:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al reenviar el código',
      error: error.message
    });
  }
};

// Login de usuario
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Email y contraseña son requeridos'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Buscar usuario por email
      const [users] = await connection.execute(
        'SELECT id, full_name, email, phone, password, verified, profile_picture FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          mensaje: 'Email o contraseña incorrectos'
        });
      }

      const user = users[0];

      // Verificar contraseña con bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          mensaje: 'Email o contraseña incorrectos'
        });
      }

      // Actualizar last_login y last_activity
      await connection.execute(
        'UPDATE users SET last_login = NOW(), last_activity = NOW() WHERE id = ?',
        [user.id]
      );

      res.json({
        success: true,
        mensaje: 'Login exitoso',
        user: {
          id: user.id.toString(),
          name: user.full_name,
          email: user.email,
          phone: user.phone,
          profile_picture: user.profile_picture,
          verified: user.verified === 1
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al hacer login:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al iniciar sesión',
      error: error.message
    });
  }
}

// Solicitar recuperación de contraseña
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        mensaje: 'El email es requerido'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Buscar usuario por email
      const [users] = await connection.execute(
        'SELECT id, full_name FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({
          success: true,
          mensaje: 'Si el email existe en nuestra base de datos, recibirás un correo con instrucciones para recuperar tu contraseña'
        });
      }

      const user = users[0];

      // Generar token de recuperación
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiryTime = Date.now() + 3600000; // 1 hora

      // Guardar token temporalmente
      passwordResetTokens.set(resetToken, {
        userId: user.id,
        email: email,
        expiry: expiryTime
      });

      // Enviar email con el enlace de recuperación
      const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Recuperación de contraseña - RK Vinos',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Recuperación de Contraseña</h2>
            <p>Hola ${user.full_name},</p>
            <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
            <p>
              <a href="${resetLink}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Restablecer Contraseña</a>
            </p>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste esta recuperación, ignora este correo.</p>
            <p style="color: #666; font-size: 12px;">RK Vinos</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        mensaje: 'Si el email existe en nuestra base de datos, recibirás un correo con instrucciones para recuperar tu contraseña'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al procesar la solicitud',
      error: error.message
    });
  }
}

// Restablecer contraseña
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        mensaje: 'Token y contraseña son requeridos'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Verificar token
    const resetData = passwordResetTokens.get(token);

    if (!resetData) {
      return res.status(400).json({
        success: false,
        mensaje: 'Token inválido o expirado'
      });
    }

    // Verificar expiración
    if (Date.now() > resetData.expiry) {
      passwordResetTokens.delete(token);
      return res.status(400).json({
        success: false,
        mensaje: 'Token expirado. Solicita una nueva recuperación de contraseña'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Hashear la nueva contraseña con bcrypt
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Actualizar contraseña con el hash
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, resetData.userId]
      );

      // Eliminar token usado
      passwordResetTokens.delete(token);

      res.json({
        success: true,
        mensaje: 'Contraseña restablecida exitosamente'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al restablecer la contraseña',
      error: error.message
    });
  }
};

// Verificar si un email está registrado
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, mensaje: 'Email requerido' });

    const connection = await mysql.createConnection(dbConfig);
    try {
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      res.json({ success: true, exists: users.length > 0 });
    } finally {
      await connection.end();
    }
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
};
