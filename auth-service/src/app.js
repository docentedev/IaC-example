require('dotenv').config()
const express  = require('express')
const { initDB } = require('./db')
const authRoutes = require('./routes/auth')

const app  = express()
const PORT = process.env.PORT || 3002

app.use(express.json())

// Todas las rutas de autenticación bajo /auth
app.use('/auth', authRoutes)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

// Inicializar la BD y arrancar el servidor
initDB()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Auth service corriendo en puerto ${PORT}`)
    )
  )
  .catch((err) => {
    console.error('Error al inicializar la base de datos:', err)
    process.exit(1)
  })
