import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'drinksrk_db'
};

// Número de salt rounds para bcrypt
const SALT_ROUNDS = 10;

// Obtener todos los usuarios registrados
export const getAllUsers = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const [users] = await connection.execute(
        'SELECT id, full_name, email, phone, created_at, verified, last_login, last_activity, profile_picture FROM users ORDER BY created_at DESC'
      );

      // Definir el tiempo de inactividad (5 minutos)
      const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
      const now = new Date();

      // Transformar los datos al formato esperado por el frontend
      const transformedUsers = users.map(user => {
        let isOnline = false;
        
        // Si el usuario tiene last_activity, verificar si está dentro del threshold
        if (user.last_activity) {
          const lastActivity = new Date(user.last_activity);
          const timeDiff = now - lastActivity;
          isOnline = timeDiff < ONLINE_THRESHOLD_MS;
        }

        return {
          id: user.id.toString(),
          name: user.full_name,
          email: user.email,
          phone: user.phone || '—',
          registeredAt: new Date(user.created_at).toISOString().split('T')[0],
          online: isOnline,
          verified: user.verified === 1,
          profile_picture: user.profile_picture,
          last_activity: user.last_activity
        };
      });

      res.json({
        success: true,
        users: transformedUsers
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Eliminar un usuario por ID
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de usuario es requerido'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verificar si el usuario existe
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // Eliminar usuario
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        mensaje: 'Usuario eliminado exitosamente'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// Actualizar la última actividad del usuario (heartbeat)
export const updateUserActivity = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de usuario es requerido'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Actualizar last_activity con la fecha/hora actual
      await connection.execute(
        'UPDATE users SET last_activity = NOW() WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        mensaje: 'Actividad actualizada'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar actividad',
      error: error.message
    });
  }
};

// Marcar usuario como offline (logout)
export const markUserOffline = async (req, res) => {
  try {
    let userId = req.body.userId;

    // Si viene como string (de sendBeacon), parsearlo
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        userId = parsed.userId;
      } catch (e) {
        // Si no se puede parsear, intentar obtenerlo directamente
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de usuario es requerido'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Establecer last_activity a NULL para marcarlo como offline inmediatamente
      await connection.execute(
        'UPDATE users SET last_activity = NULL WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        mensaje: 'Usuario marcado como offline'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al marcar usuario offline:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al marcar usuario offline',
      error: error.message
    });
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, password, profile_picture } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de usuario es requerido'
      });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Verificar si el usuario existe
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({
          success: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // Construir query dinámica según los campos a actualizar
      let updateFields = [];
      let updateValues = [];

      if (full_name) {
        updateFields.push('full_name = ?');
        updateValues.push(full_name);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone || null);
      }
      if (password) {
        // Hashear la contraseña antes de actualizar
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }
      if (profile_picture !== undefined) {
        updateFields.push('profile_picture = ?');
        updateValues.push(profile_picture || null);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'No se proporcionaron campos para actualizar'
        });
      }

      updateValues.push(id);

      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await connection.execute(query, updateValues);

      // Obtener usuario actualizado
      const [updatedUsers] = await connection.execute(
        'SELECT id, full_name, email, phone, profile_picture FROM users WHERE id = ?',
        [id]
      );

      const updatedUser = updatedUsers[0];

      res.json({
        success: true,
        mensaje: 'Perfil actualizado exitosamente',
        user: {
          id: updatedUser.id.toString(),
          name: updatedUser.full_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          profile_picture: updatedUser.profile_picture
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar perfil',
      error: error.message
    });
  }
};
