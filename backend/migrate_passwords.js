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

const SALT_ROUNDS = 10;

async function migratePasswords() {
  //console.log('🔄 Iniciando migración de contraseñas...\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Obtener todos los usuarios
      const [users] = await connection.execute(
        'SELECT id, email, password FROM users'
      );

      if (users.length === 0) {
        //console.log('ℹ️  No hay usuarios en la base de datos.');
        return;
      }

      //console.log(`📊 Se encontraron ${users.length} usuarios\n`);

      let migratedCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        // Verificar si la contraseña ya está hasheada (bcrypt hash empieza con $2a$, $2b$ o $2y$)
        if (user.password && user.password.startsWith('$2')) {
          //console.log(`⏩ Saltando ${user.email} - Ya tiene contraseña hasheada`);
          skippedCount++;
          continue;
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        
        // Actualizar en la base de datos
        await connection.execute(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );

        console.log(`✅ Migrado: ${user.email}`);
        migratedCount++;
      }

      //console.log('\n' + '='.repeat(50));
      //console.log(`✅ Migración completada:`);
      //console.log(`   - Usuarios migrados: ${migratedCount}`);
      //console.log(`   - Usuarios saltados: ${skippedCount}`);
      //console.log(`   - Total: ${users.length}`);
      //console.log('='.repeat(50));

    } finally {
      await connection.end();
    }

  } catch (error) {
    //console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración
migratePasswords()
  .then(() => {
   // console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    //console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
