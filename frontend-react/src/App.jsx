import { useState, useEffect } from 'react'

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
