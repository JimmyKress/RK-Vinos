import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function connec(){
    try{
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0 
        })
        return connection;
    }catch(error){
        console.error('Error connecting to MySQL:', error);
        throw error;
    }
    
}

export default connec;
