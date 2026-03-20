const express = require('express')
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const { pool } = require('../db')

const router = express.Router()
const JWT_SECRET  = process.env.JWT_SECRET
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h'
const SALT_ROUNDS = 10

// ──────────────────────────────────────────────────────────────────────
//  POST /auth/register
//  Registra un nuevo usuario y devuelve un JWT.
// ──────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, lastName, phone, email, address, username, password } = req.body

  if (!name || !lastName || !email || !username || !password) {
    return res.status(400).json({
      error: 'Campos requeridos: name, lastName, email, username, password',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const result = await pool.query(
      `INSERT INTO users (name, last_name, phone, email, address, username, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, last_name, email, username`,
      [name, lastName, phone || null, email, address || null, username, passwordHash]
    )

    const user  = result.rows[0]
    const token = jwt.sign(
      { sub: String(user.id), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    res.status(201).json({ token, user })
  } catch (err) {
    // Código 23505 = violación de unicidad en PostgreSQL
    if (err.code === '23505') {
      if (err.constraint && err.constraint.includes('email')) {
        return res.status(409).json({ error: 'El email ya está en uso' })
      }
      if (err.constraint && err.constraint.includes('username')) {
        return res.status(409).json({ error: 'El username ya está en uso' })
      }
    }
    console.error('Error en /register:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ──────────────────────────────────────────────────────────────────────
//  POST /auth/login
//  Valida credenciales y devuelve un JWT.
// ──────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'username y password son requeridos' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )

    // Mensaje genérico para no revelar si el usuario existe o no.
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const user  = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = jwt.sign(
      { sub: String(user.id), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    res.json({
      token,
      user: {
        id:        user.id,
        name:      user.name,
        last_name: user.last_name,
        email:     user.email,
        username:  user.username,
      },
    })
  } catch (err) {
    console.error('Error en /login:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ──────────────────────────────────────────────────────────────────────
//  GET /auth/me
//  Devuelve los datos del usuario autenticado (requiere JWT).
// ──────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Header Authorization requerido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const result  = await pool.query(
      `SELECT id, name, last_name, phone, email, address, username, created_at
       FROM users WHERE id = $1`,
      [decoded.sub]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
})

module.exports = router
