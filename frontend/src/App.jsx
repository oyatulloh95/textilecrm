import { useEffect, useState, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Mock data for dashboard
const MOCK_RECENT_ORDERS = [
  { id: 1, customer: 'Ali Karim', product: 'Premium Cotton', quantity: 100, amount: 5000, status: 'completed', date: '2026-06-17' },
  { id: 2, customer: 'Fatima Mansurov', product: 'Silk Fabric', quantity: 50, amount: 3500, status: 'processing', date: '2026-06-17' },
  { id: 3, customer: 'Mohammad Qo\'chqorov', product: 'Wool Blend', quantity: 200, amount: 8000, status: 'pending', date: '2026-06-16' },
  { id: 4, customer: 'Dilshod Husainov', product: 'Polyester Mix', quantity: 75, amount: 2250, status: 'completed', date: '2026-06-16' },
  { id: 5, customer: 'Nora Salimova', product: 'Linen', quantity: 30, amount: 1800, status: 'completed', date: '2026-06-15' },
]

const MOCK_CHART_DATA = {
  labels: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  salesData: [2500, 3200, 2800, 4100, 3800, 5200],
  ordersData: [12, 19, 8, 15, 13, 18],
}

// Login Component
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email va parol majburiy')
      return
    }
    // Simple front-end validation
    if (email.includes('@')) {
      onLogin({ email, name: email.split('@')[0] })
      setError('')
    } else {
      setError('Noto\'g\'ri email')
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>TextileCRM</h1>
        <p className="login-subtitle">Tizimga kirish</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-btn">Kirish</button>
        </form>
        <p className="login-hint">Demo: istalgan email va parol ishlatishingiz mumkin</p>
      </div>
    </div>
  )
}

// Sales Chart Component
function SalesChart() {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      const ctx = chartRef.current.getContext('2d')
      chartInstance.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: MOCK_CHART_DATA.labels,
          datasets: [{
            label: 'Sotuvlar (UZS)',
            data: MOCK_CHART_DATA.salesData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true } },
        },
      })
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [])

  return <canvas ref={chartRef} />
}

// Orders Chart Component
function OrdersChart() {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      const ctx = chartRef.current.getContext('2d')
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: MOCK_CHART_DATA.labels,
          datasets: [{
            label: 'Buyurtmalar soni',
            data: MOCK_CHART_DATA.ordersData,
            backgroundColor: '#2196F3',
            borderColor: '#1976D2',
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } },
        },
      })
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [])

  return <canvas ref={chartRef} />
}

// Recent Orders Component
function RecentOrders() {
  return (
    <div className="recent-orders">
      <h3>So'nggi buyurtmalar</h3>
      <table className="recent-table">
        <thead>
          <tr>
            <th>Buyurtma ID</th>
            <th>Mijoz</th>
            <th>Mahsulot</th>
            <th>Miqdor</th>
            <th>Summa</th>
            <th>Holat</th>
            <th>Sana</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_RECENT_ORDERS.map(order => (
            <tr key={order.id} className={`status-${order.status}`}>
              <td>#{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.product}</td>
              <td>{order.quantity}</td>
              <td>{order.amount.toLocaleString()} UZS</td>
              <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
              <td>{order.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// useApi hook for backend integration
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
        <input placeholder="Maxsulot Nomi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
        <input placeholder="Maxsulot turi" value={form.fabric_type} onChange={e => setForm({ ...form, fabric_type: e.target.value })} />
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
        <input placeholder="Maxsulot Nomi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
        <input placeholder="Maxsulot turi" value={form.fabric_type} onChange={e => setForm({ ...form, fabric_type: e.target.value })} />
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
  const stats = {
    customers: 45,
    products: 128,
    orders: 234,
    revenue: 125500,
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <div className="cards">
        <div className="card">
          <h3>{stats.customers}</h3>
          <p>Mijozlar</p>
        </div>
        <div className="card">
          <h3>{stats.products}</h3>
          <p>Mahsulotlar</p>
        </div>
        <div className="card">
          <h3>{stats.orders}</h3>
          <p>Buyurtmalar</p>
        </div>
        <div className="card">
          <h3>{stats.revenue.toLocaleString()}</h3>
          <p>Daromad (UZS)</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h3>Sotuvlar Grafikasi</h3>
          <SalesChart />
        </div>
        <div className="chart-box">
          <h3>Buyurtmalar Grafikasi</h3>
          <OrdersChart />
        </div>
      </div>

      <RecentOrders />
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [user, setUser] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setTab('dashboard')
  }

  // Show login page if not logged in
  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>TextileCRM</h1>
        </div>
        <nav>
          <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'active' : ''}>Dashboard</button>
          <button onClick={() => setTab('customers')} className={tab === 'customers' ? 'active' : ''}>Mijozlar</button>
          <button onClick={() => setTab('products')} className={tab === 'products' ? 'active' : ''}>Mahsulotlar</button>
          <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'active' : ''}>Buyurtmalar</button>
        </nav>
        <div className="header-right">
          <span className="user-name">{user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Chiqish</button>
        </div>
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
