import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function useApi(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}${endpoint}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [endpoint])

  return { data, loading, error, refresh }
}

function CustomersTab() {
  const { data: customers, refresh } = useApi('/customers')
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '' })

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setForm({ name: '', company: '', phone: '', email: '', address: '' })
      refresh()
    } catch (err) {
      alert(`Xato: ${err.message}`)
      console.error('POST /customers error:', err)
    }
  }

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      refresh()
    } catch (err) {
      console.error('DELETE /customers error:', err)
    }
  }

  return (
    <div>
      <h2>Mijozlar</h2>
      <form onSubmit={submit} className="form-row">
        <input placeholder="Ism" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Kompaniya" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
        <input placeholder="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Manzil" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <button type="submit">Qo'shish</button>
      </form>
      <table>
        <thead>
          <tr><th>ID</th><th>Ism</th><th>Kompaniya</th><th>Telefon</th><th>Email</th><th></th></tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td><td>{c.name}</td><td>{c.company}</td><td>{c.phone}</td><td>{c.email}</td>
              <td><button onClick={() => remove(c.id)}>O'chirish</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductsTab() {
  const { data: products, refresh } = useApi('/products')
  const [form, setForm] = useState({ name: '', sku: '', fabric_type: '', price: '', stock_qty: '' })

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), stock_qty: Number(form.stock_qty) }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setForm({ name: '', sku: '', fabric_type: '', price: '', stock_qty: '' })
      refresh()
    } catch (err) {
      alert(`Xato: ${err.message}`)
      console.error('POST /products error:', err)
    }
  }

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      refresh()
    } catch (err) {
      console.error('DELETE /products error:', err)
    }
  }

  return (
    <div>
      <h2>Mahsulotlar</h2>
      <form onSubmit={submit} className="form-row">
        <input placeholder="Nomi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
        <input placeholder="Mato turi" value={form.fabric_type} onChange={e => setForm({ ...form, fabric_type: e.target.value })} />
        <input placeholder="Narx" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
        <input placeholder="Zaxira" type="number" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} required />
        <button type="submit">Qo'shish</button>
      </form>
      <table>
        <thead>
          <tr><th>ID</th><th>Nomi</th><th>SKU</th><th>Mato</th><th>Narx</th><th>Zaxira</th><th></th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td><td>{p.name}</td><td>{p.sku}</td><td>{p.fabric_type}</td><td>{p.price}</td><td>{p.stock_qty}</td>
              <td><button onClick={() => remove(p.id)}>O'chirish</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrdersTab() {
  const { data: orders, refresh } = useApi('/orders')
  const { data: customers } = useApi('/customers')
  const { data: products } = useApi('/products')
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const submit = async (e) => {
    e.preventDefault()
    const product = products.find(p => p.id === Number(productId))
    if (!product) return
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(customerId),
          status: 'pending',
          items: [{ product_id: Number(productId), quantity: Number(quantity), unit_price: product.price }],
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      refresh()
    } catch (err) {
      alert(`Xato: ${err.message}`)
      console.error('POST /orders error:', err)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      refresh()
    } catch (err) {
      console.error('PUT /orders error:', err)
    }
  }

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      refresh()
    } catch (err) {
      console.error('DELETE /orders error:', err)
    }
  }

  return (
    <div>
      <h2>Buyurtmalar</h2>
      <form onSubmit={submit} className="form-row">
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
          <option value="">Mijoz tanlang</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={productId} onChange={e => setProductId(e.target.value)} required>
          <option value="">Mahsulot tanlang</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price})</option>)}
        </select>
        <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <button type="submit">Buyurtma yaratish</button>
      </form>
      <table>
        <thead>
          <tr><th>ID</th><th>Mijoz ID</th><th>Holat</th><th>Summa</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td><td>{o.customer_id}</td>
              <td>
                <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="processing">processing</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
              <td>{o.total_amount}</td>
              <td><button onClick={() => remove(o.id)}>O'chirish</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Dashboard() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/dashboard/summary`).then(r => r.json()).then(setSummary)
  }, [])

  if (!summary) return <p>Yuklanmoqda...</p>

  return (
    <div className="cards">
      <div className="card"><h3>{summary.customers}</h3><p>Mijozlar</p></div>
      <div className="card"><h3>{summary.products}</h3><p>Mahsulotlar</p></div>
      <div className="card"><h3>{summary.orders}</h3><p>Buyurtmalar</p></div>
      <div className="card"><h3>{summary.revenue.toFixed(2)}</h3><p>Daromad</p></div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app">
      <header>
        <h1>TextileCRM</h1>
        <nav>
          <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'active' : ''}>Dashboard</button>
          <button onClick={() => setTab('customers')} className={tab === 'customers' ? 'active' : ''}>Mijozlar</button>
          <button onClick={() => setTab('products')} className={tab === 'products' ? 'active' : ''}>Mahsulotlar</button>
          <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'active' : ''}>Buyurtmalar</button>
        </nav>
      </header>
      <main>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'customers' && <CustomersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
      </main>
    </div>
  )
}
