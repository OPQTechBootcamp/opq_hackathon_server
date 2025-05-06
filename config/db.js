import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
  connectTimeout: 60000,
  idleTimeout: 60000 * 60,
  timezone: 'Z', // Set timezone to UTC explicitly
});

setInterval(async () => {
  try {
    await db.query('SELECT 1');
    console.log('DB keepalive ping successful');
  } catch (error) {
    console.error('DB keepalive ping failed:', error);
  }
}, 5 * 60 * 1000);

export default db;