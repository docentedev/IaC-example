const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Crea la tabla de usuarios si no existe al arrancar el servicio.
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      last_name  VARCHAR(100) NOT NULL,
      phone      VARCHAR(20),
      email      VARCHAR(150) NOT NULL UNIQUE,
      address    TEXT,
      username   VARCHAR(50)  NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  console.log('Base de datos inicializada')
}

module.exports = { pool, initDB }
