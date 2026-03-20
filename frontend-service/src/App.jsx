import { useState, useEffect, useCallback, useRef } from 'react'
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

// ─── CartPanel ────────────────────────────────────────────────────────────────
// Muestra el carrito del usuario autenticado.
// Cuando el usuario NO está logueado, el panel se muestra deshabilitado
// (para que el alumno vea la integración incluso antes de autenticarse).
// Los datos del carrito se enriquecen con info del producto en el back-end
// (cart-service llama internamente a product-service: comunicación inter-servicio).
function CartPanel({ onAddToCart }) {
  const { isLoggedIn, token } = useAuth()
  const [cart, setCart]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn || !token) { setCart(null); return }
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      setCart(data)
      setError(null)
    } catch (e) {
      setError('cart-service no disponible (Phase 7 pendiente de deploy)')
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn, token])

  // Recarga el carrito cuando cambia el estado de sesión.
  useEffect(() => { fetchCart() }, [fetchCart])

  // Expone fetchCart al padre para que pueda refrescar tras agregar un ítem.
  useEffect(() => {
    if (onAddToCart) onAddToCart.current = fetchCart
  }, [fetchCart, onAddToCart])

  const btnStyle = (bg, disabled) => ({
    background: disabled ? '#aaa' : bg,
    color: 'white', border: 'none',
    padding: '0.3rem 0.8rem', borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.85rem',
  })

  async function removeItem(product_id) {
    await fetch(`${BASE_URL}/cart/items/${product_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchCart()
  }

  async function clearCart() {
    await fetch(`${BASE_URL}/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchCart()
  }

  return (
    <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #f0c040', borderRadius: 8 }}>
      <h2>🛒 Carrito de compras (cart-service)</h2>

      {!isLoggedIn && (
        <p style={{ color: '#888' }}>
          Inicia sesión para ver tu carrito. Este panel consume <strong>cart-service</strong>{' '}
          (FastAPI/Python) que a su vez llama a <strong>product-service</strong> internamente.
        </p>
      )}

      {isLoggedIn && loading && <p>Cargando carrito...</p>}

      {isLoggedIn && error && (
        <p style={{ color: '#b06000' }}>{error}</p>
      )}

      {isLoggedIn && cart && !loading && (
        <>
          {cart.items.length === 0 ? (
            <p style={{ color: '#555' }}>Tu carrito está vacío. Agrega productos desde la lista de abajo.</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                    <th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.product_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td>{item.product ? item.product.name : `#${item.product_id}`}</td>
                      <td>${item.product ? Number(item.product.price).toFixed(2) : '—'}</td>
                      <td>{item.quantity}</td>
                      <td>${item.subtotal.toFixed(2)}</td>
                      <td>
                        <button style={btnStyle('#c00', false)} onClick={() => removeItem(item.product_id)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '0.5rem' }}>
                Total: ${cart.total.toFixed(2)}
              </p>
              <button style={btnStyle('#888', false)} onClick={clearCart}>Vaciar carrito</button>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default function App() {
  const { isLoggedIn, token } = useAuth()
  const [products, setProducts] = useState(null)
  const [users, setUsers]       = useState(null)
  // Ref para poder llamar fetchCart desde el botón "Agregar al carrito".
  const refreshCart = useRef(null)

  useEffect(() => {
    fetch(`${BASE_URL}/products`)
      .then((r) => r.json())
      .then(normalizeListPayload)
      .then(setProducts)
      .catch(() => setProducts({ error: 'No se pudo conectar con product-service' }))

    fetch(`${BASE_URL}/users`)
      .then((r) => r.json())
      .then(normalizeListPayload)
      .then(setUsers)
      .catch(() => setUsers({ error: 'No se pudo conectar con user-service' }))
  }, [])

  async function addToCart(product_id) {
    if (!isLoggedIn || !token) return
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, quantity: 1 }),
    })
    // Refresca el panel del carrito tras agregar.
    if (refreshCart.current) refreshCart.current()
  }

  const btnAddStyle = (disabled) => ({
    background: disabled ? '#ccc' : '#0b5fff',
    color: 'white', border: 'none',
    padding: '0.2rem 0.6rem', borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.8rem', marginLeft: '0.5rem',
  })

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '760px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Microservicios DuocUC</h1>
      <p style={{ color: '#555' }}>
        Frontend estático servido por nginx &rarr; Traefik &rarr; KrakenD &rarr; microservicios
      </p>

      <AuthPanel />

      <CartPanel onAddToCart={refreshCart} />

      <Section
        title="Productos (product-service)"
        items={products}
        renderItem={(p) => (
          <span>
            [{p.id}] {p.name} — ${p.price}
            <button
              style={btnAddStyle(!isLoggedIn)}
              disabled={!isLoggedIn}
              title={isLoggedIn ? 'Agregar al carrito' : 'Inicia sesión para agregar'}
              onClick={() => addToCart(p.id)}
            >
              🛒 Agregar
            </button>
          </span>
        )}
      />

      <Section
        title="Usuarios (user-service)"
        items={users}
        renderItem={(u) => `[${u.id}] ${u.name} — ${u.email}`}
      />
    </div>
  )
}
