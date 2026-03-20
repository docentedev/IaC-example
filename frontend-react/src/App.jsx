import { useState, useEffect } from 'react'
import { useAuth } from './auth/AuthContext.jsx'

const BASE_URL = '/api'

function Section({ title, items, renderItem }) {
  if (!items) return <p>Cargando {title.toLowerCase()}...</p>
  if (items.error) return <p style={{ color: 'red' }}>Error: {items.error}</p>

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p>Sin datos.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.collection)) return payload.collection
  return []
}

function AuthPanel() {
  const { isLoggedIn, user, error, loading, login, register, logout } = useAuth()
  const [view, setView]         = useState(null) // null | 'login' | 'register'
  const [form, setForm]         = useState({})

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleLogin(e) {
    e.preventDefault()
    try {
      await login(form.username, form.password)
      setView(null)
      setForm({})
    } catch {}
  }

  async function handleRegister(e) {
    e.preventDefault()
    try {
      await register({
        name:     form.name,
        lastName: form.lastName,
        email:    form.email,
        phone:    form.phone,
        address:  form.address,
        username: form.username,
        password: form.password,
      })
      setView(null)
      setForm({})
    } catch {}
  }

  const inputStyle = {
    display: 'block', width: '100%', marginBottom: '0.5rem',
    padding: '0.4rem', boxSizing: 'border-box',
  }
  const btnStyle = (bg) => ({
    background: bg, color: 'white', border: 'none',
    padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer',
  })

  return (
    <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Autenticacion</h2>

      {isLoggedIn ? (
        <div>
          <p style={{ color: '#1a7f37' }}>
            Sesion iniciada como <strong>{user?.username}</strong> ({user?.email})
          </p>
          <button style={btnStyle('#c00')} onClick={logout}>Cerrar sesion</button>
        </div>
      ) : (
        <>
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button style={btnStyle('#0b5fff')} onClick={() => setView(view === 'login' ? null : 'login')}>
              Iniciar sesion
            </button>
            <button style={btnStyle('#0b8f3f')} onClick={() => setView(view === 'register' ? null : 'register')}>
              Crear cuenta
            </button>
          </div>

          {view === 'login' && (
            <form onSubmit={handleLogin}>
              <input style={inputStyle} name="username" placeholder="Username" onChange={handleChange} required />
              <input style={inputStyle} name="password" type="password" placeholder="Password" onChange={handleChange} required />
              <button style={btnStyle('#0b5fff')} type="submit" disabled={loading}>
                {loading ? 'Iniciando...' : 'Entrar'}
              </button>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister}>
              <input style={inputStyle} name="name"     placeholder="Nombre *"    onChange={handleChange} required />
              <input style={inputStyle} name="lastName" placeholder="Apellido *"  onChange={handleChange} required />
              <input style={inputStyle} name="email"    type="email" placeholder="Email *" onChange={handleChange} required />
              <input style={inputStyle} name="username" placeholder="Username *"  onChange={handleChange} required />
              <input style={inputStyle} name="password" type="password" placeholder="Password *" onChange={handleChange} required />
              <input style={inputStyle} name="phone"    placeholder="Telefono"    onChange={handleChange} />
              <input style={inputStyle} name="address"  placeholder="Direccion"   onChange={handleChange} />
              <button style={btnStyle('#0b8f3f')} type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  )
}

export default function App() {
  const [products, setProducts] = useState(null)
  const [users, setUsers] = useState(null)

  useEffect(() => {
    fetch(`${BASE_URL}/products`)
      .then((r) => r.json())
      .then(normalizeListPayload)
      .then(setProducts)
      .catch(() => setProducts({ error: 'No se pudo conectar con products-java' }))

    fetch(`${BASE_URL}/users`)
      .then((r) => r.json())
      .then(normalizeListPayload)
      .then(setUsers)
      .catch(() => setUsers({ error: 'No se pudo conectar con users-nodejs' }))
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Microservicios DuocUC</h1>
      <p style={{ color: '#555' }}>
        Frontend estático servido por nginx &rarr; Traefik &rarr; KrakenD &rarr; microservicios
      </p>

      <AuthPanel />

      <Section
        title="Productos (products-java)"
        items={products}
        renderItem={(p) => `[${p.id}] ${p.name} — $${p.price}`}
      />

      <Section
        title="Usuarios (users-nodejs)"
        items={users}
        renderItem={(u) => `[${u.id}] ${u.name} — ${u.email}`}
      />
    </div>
  )
}
