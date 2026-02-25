import { useEffect, useMemo, useRef, useState } from 'react'
import { adminApi } from '../api/adminApi'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const getOrderAmount = (order) => Number(order?.total || order?.payment?.amount || 0)

const getStartOfDay = (date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const getDayKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getRangeBounds = (range) => {
  const today = getStartOfDay(new Date())
  let start

  if (range === 'weekly') {
    start = new Date(today)
    start.setDate(today.getDate() - 6)
  } else if (range === 'monthly') {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
  } else {
    start = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  }

  return { start, end: today }
}

const isWithinRange = (orderDate, range) => {
  const date = getStartOfDay(new Date(orderDate))
  if (Number.isNaN(date.getTime())) return false
  const { start, end } = getRangeBounds(range)
  return date >= start && date <= end
}

const getPaymentMethodLabel = (method) => {
  const key = String(method || 'unknown').toLowerCase()
  if (key === 'upi') return 'UPI'
  if (key === 'cod') return 'COD'
  if (key === 'phonepe') return 'PhonePe'
  if (key === 'googlepay') return 'Google Pay'
  if (key === 'paytm') return 'Paytm'
  if (key === 'amazonpay') return 'Amazon Pay'
  if (key === 'card') return 'Card'
  return 'Other'
}

const buildWeeklyPoints = (orders) => {
  const today = getStartOfDay(new Date())
  const dayBuckets = []
  const bucketMap = new Map()

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const key = getDayKey(day)
    const label = day.toLocaleDateString('en-US', { weekday: 'short' })
    dayBuckets.push({ key, label, value: 0 })
    bucketMap.set(key, dayBuckets[dayBuckets.length - 1])
  }

  orders.forEach((order) => {
    const createdAt = new Date(order?.createdAt)
    if (Number.isNaN(createdAt.getTime())) return
    const key = getDayKey(getStartOfDay(createdAt))
    const bucket = bucketMap.get(key)
    if (!bucket) return
    bucket.value += getOrderAmount(order)
  })

  return dayBuckets
}

const buildMonthlyPoints = (orders) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const weekCount = Math.ceil(daysInMonth / 7)
  const buckets = Array.from({ length: weekCount }, (_, index) => ({
    label: `W${index + 1}`,
    value: 0,
  }))

  orders.forEach((order) => {
    const createdAt = getStartOfDay(new Date(order?.createdAt))
    if (Number.isNaN(createdAt.getTime()) || createdAt < monthStart) return
    if (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear()) return
    const dayOfMonth = createdAt.getDate()
    const weekIndex = Math.floor((dayOfMonth - 1) / 7)
    if (buckets[weekIndex]) {
      buckets[weekIndex].value += getOrderAmount(order)
    }
  })

  return buckets
}

const buildHalfYearPoints = (orders) => {
  const now = new Date()
  const monthBuckets = []
  const monthMap = new Map()

  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
    const label = monthDate.toLocaleDateString('en-US', { month: 'short' })
    monthBuckets.push({ key, label, value: 0 })
    monthMap.set(key, monthBuckets[monthBuckets.length - 1])
  }

  orders.forEach((order) => {
    const createdAt = new Date(order?.createdAt)
    if (Number.isNaN(createdAt.getTime())) return
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`
    const bucket = monthMap.get(key)
    if (!bucket) return
    bucket.value += getOrderAmount(order)
  })

  return monthBuckets
}

function DashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
  })
  const [ordersForRevenue, setOrdersForRevenue] = useState([])
  const [range, setRange] = useState('weekly')
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const chartWrapRef = useRef(null)

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true)
      setStatsError('')
      try {
        console.log('Loading dashboard stats')
        const [productsRes, firstOrdersRes, usersRes] = await Promise.all([
          adminApi.getProducts({ page: 1, limit: 1 }),
          adminApi.getOrders({ page: 1, limit: 100, sortBy: 'createdAt', order: 'desc' }),
          adminApi.getUsers({ page: 1, limit: 1 }),
        ])

        console.log('Dashboard API responses:', { productsRes, firstOrdersRes, usersRes })

        const allOrders = Array.isArray(firstOrdersRes?.orders) ? [...firstOrdersRes.orders] : []
        const totalPages = Number(firstOrdersRes?.pagination?.totalPages || 1)

        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page += 1) {
            const pageRes = await adminApi.getOrders({
              page,
              limit: 100,
              sortBy: 'createdAt',
              order: 'desc',
            })
            if (Array.isArray(pageRes?.orders)) {
              allOrders.push(...pageRes.orders)
            }
          }
        }

        setStats({
          products: Number(productsRes?.pagination?.total || 0),
          orders: Number(firstOrdersRes?.pagination?.total || 0),
          users: Number(usersRes?.pagination?.total || 0),
        })
        setOrdersForRevenue(allOrders)
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        setStatsError(error.message || 'Failed to load dashboard totals')
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [])

  const points = useMemo(() => {
    const filteredOrders = ordersForRevenue.filter((order) => isWithinRange(order?.createdAt, range))
    if (range === 'monthly') return buildMonthlyPoints(filteredOrders)
    if (range === 'halfYearly') return buildHalfYearPoints(filteredOrders)
    return buildWeeklyPoints(filteredOrders)
  }, [ordersForRevenue, range])

  const paymentSummary = useMemo(() => {
    const filteredOrders = ordersForRevenue.filter((order) => isWithinRange(order?.createdAt, range))
    const totals = {}
    filteredOrders.forEach((order) => {
      const methodLabel = getPaymentMethodLabel(order?.payment?.method)
      totals[methodLabel] = (totals[methodLabel] || 0) + getOrderAmount(order)
    })

    const list = Object.entries(totals)
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)

    const upi = list.find((item) => item.label === 'UPI')?.amount || 0
    const cod = list.find((item) => item.label === 'COD')?.amount || 0
    const card = list.find((item) => item.label === 'Card')?.amount || 0

    return { list, upi, cod, card }
  }, [ordersForRevenue, range])

  const chart = useMemo(() => {
    const width = 760
    const height = 260
    const padX = 44
    const padY = 24
    const values = points.map((point) => point.value)
    const max = values.length ? Math.max(...values) : 0
    const min = values.length ? Math.min(...values) : 0
    const span = Math.max(1, max - min)
    const stepX = (width - padX * 2) / Math.max(1, points.length - 1)

    const mapped = points.map((point, index) => {
      const x = padX + index * stepX
      const y = height - padY - ((point.value - min) / span) * (height - padY * 2)
      return { ...point, x, y }
    })

    return {
      width,
      height,
      padY,
      mapped,
      polyline: mapped.map((point) => `${point.x},${point.y}`).join(' '),
    }
  }, [points])

  const rangeLabel = range === 'weekly' ? 'Weekly' : range === 'monthly' ? 'Monthly' : 'Half Yearly'

  const onPointHover = (event, point) => {
    if (!chartWrapRef.current) return
    const rect = chartWrapRef.current.getBoundingClientRect()
    setHoveredPoint({
      ...point,
      left: event.clientX - rect.left + 14,
      top: event.clientY - rect.top - 52,
    })
  }

  return (
    <section className="page">
      <h2>Dashboard</h2>
      {statsError ? <div className="auth-error">{statsError}</div> : null}
      <div className="stats-grid">
        <article className="stat-card">
          <p>Total Products</p>
          <h3>{statsLoading ? '...' : stats.products}</h3>
        </article>
        <article className="stat-card">
          <p>Total Orders</p>
          <h3>{statsLoading ? '...' : stats.orders}</h3>
        </article>
        <article className="stat-card">
          <p>Total Users</p>
          <h3>{statsLoading ? '...' : stats.users}</h3>
        </article>
      </div>
      <article className="panel chart-panel">
        <div className="chart-head">
          <h3>{rangeLabel} Revenue Trend</h3>
          <div className="chip-group">
            <button
              className={`chip ${range === 'weekly' ? 'active' : ''}`}
              type="button"
              onClick={() => setRange('weekly')}
            >
              Weekly
            </button>
            <button
              className={`chip ${range === 'monthly' ? 'active' : ''}`}
              type="button"
              onClick={() => setRange('monthly')}
            >
              Monthly
            </button>
            <button
              className={`chip ${range === 'halfYearly' ? 'active' : ''}`}
              type="button"
              onClick={() => setRange('halfYearly')}
            >
              Half Yearly
            </button>
          </div>
        </div>
        <div className="chart-wrap" ref={chartWrapRef}>
          {hoveredPoint ? (
            <div
              className="revenue-tooltip"
              style={{
                left: `${hoveredPoint.left}px`,
                top: `${hoveredPoint.top}px`,
              }}
            >
              <strong>{hoveredPoint.label}</strong>
              <span>{formatCurrency(hoveredPoint.value)}</span>
            </div>
          ) : null}
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="line-chart" role="img" aria-label="Revenue line chart">
            <defs>
              <linearGradient id="lineGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chart.mapped.map((point) => (
              <line
                key={`grid-${point.label}`}
                x1={point.x}
                y1={chart.padY}
                x2={point.x}
                y2={chart.height - chart.padY}
                stroke="#1f2a44"
                strokeWidth="1"
              />
            ))}
            <polyline
              key={`fill-${range}`}
              className="line-area"
              points={`${chart.mapped[0].x},${chart.height - chart.padY} ${chart.polyline} ${chart.mapped[chart.mapped.length - 1].x},${chart.height - chart.padY}`}
              fill="url(#lineGradient)"
              stroke="none"
            />
            <polyline
              key={`line-${range}`}
              className="line-path"
              points={chart.polyline}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {chart.mapped.map((point) => (
              <g key={`dot-${point.label}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredPoint?.label === point.label ? '7' : '5'}
                  className="line-point"
                  fill="#0b1220"
                  stroke="#67e8f9"
                  strokeWidth="2"
                  onMouseMove={(event) => onPointHover(event, point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text x={point.x} y={chart.height - 6} textAnchor="middle" className="chart-label">
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="payment-summary" key={`payment-${range}`}>
          <div className="payment-stat">
            <p>UPI ({rangeLabel})</p>
            <h4>{formatCurrency(paymentSummary.upi)}</h4>
          </div>
          <div className="payment-stat">
            <p>COD ({rangeLabel})</p>
            <h4>{formatCurrency(paymentSummary.cod)}</h4>
          </div>
          <div className="payment-stat">
            <p>Card ({rangeLabel})</p>
            <h4>{formatCurrency(paymentSummary.card)}</h4>
          </div>
          {paymentSummary.list.map((item) => (
            <div className="payment-chip" key={item.label}>
              <span>{item.label}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

export default DashboardPage
