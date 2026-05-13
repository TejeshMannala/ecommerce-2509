import { useEffect, useMemo, useRef, useState } from 'react'
import { adminApi } from '../api/adminApi'

const ORDER_STATUS_CONFIG = [
  { key: 'pending', label: 'Pending', color: '#60a5fa' },
  { key: 'confirmed', label: 'Confirmed', color: '#22d3ee' },
  { key: 'processing', label: 'Processing', color: '#38bdf8' },
  { key: 'shipped', label: 'Shipped', color: '#818cf8' },
  { key: 'out_for_delivery', label: 'Out for Delivery', color: '#a78bfa' },
  { key: 'delivered', label: 'Delivered', color: '#34d399' },
  { key: 'cancelled', label: 'Cancelled', color: '#f87171' },
  { key: 'refunded', label: 'Refunded', color: '#f59e0b' },
  { key: 'failed', label: 'Failed', color: '#ef4444' },
]

const PAYMENT_METHOD_CONFIG = [
  { key: 'card', label: 'Card', color: '#818cf8' },
  { key: 'upi', label: 'UPI', color: '#38bdf8' },
  { key: 'phonepe', label: 'PhonePe', color: '#8b5cf6' },
  { key: 'googlepay', label: 'Google Pay', color: '#22d3ee' },
  { key: 'paytm', label: 'Paytm', color: '#0ea5e9' },
  { key: 'amazonpay', label: 'Amazon Pay', color: '#f59e0b' },
  { key: 'cod', label: 'Cash on Delivery', color: '#f97316' },
]

const FALLBACK_COLORS = ['#94a3b8', '#64748b', '#475569', '#334155']

const formatLabel = (value) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const buildChartData = (counts, config) => {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  if (!total) return []

  const configMap = new Map(config.map((entry) => [entry.key, entry]))
  const seen = new Set()

  const preferredOrder = config
    .map((entry) => [entry.key, counts[entry.key] || 0])
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      key,
      count,
      label: configMap.get(key)?.label || formatLabel(key),
      color: configMap.get(key)?.color || '#94a3b8',
    }))

  preferredOrder.forEach((entry) => seen.add(entry.key))

  const unknownEntries = Object.entries(counts)
    .filter(([key, count]) => count > 0 && !seen.has(key))
    .map(([key, count], index) => ({
      key,
      count,
      label: formatLabel(key),
      color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }))

  return [...preferredOrder, ...unknownEntries].map((entry) => ({
    ...entry,
    percent: Number(((entry.count / total) * 100).toFixed(1)),
  }))
}

const polarToCartesian = (cx, cy, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

function PieBlock({ title, data, total, centerLabel }) {
  const [tooltip, setTooltip] = useState(null)
  const pieRef = useRef(null)
  let startAngle = 0

  const showTooltip = (event, entry) => {
    if (!pieRef.current) return
    const rect = pieRef.current.getBoundingClientRect()
    setTooltip({
      label: entry.label,
      count: entry.count,
      percent: entry.percent,
      x: event.clientX - rect.left + 12,
      y: event.clientY - rect.top + 12,
    })
  }

  const hideTooltip = () => setTooltip(null)

  return (
    <article className="panel pie-panel">
      <h3>{title}</h3>
      <div className="pie-wrap">
        <div className="pie-svg-wrap" ref={pieRef}>
          <svg viewBox="0 0 220 220" className="pie-svg" role="img" aria-label={title}>
            {total === 0 ? (
              <circle cx="110" cy="110" r="90" fill="#1f2937" stroke="#2b3a5a" strokeWidth="1" />
            ) : (
              data.map((entry) => {
                const sweep = (entry.count / total) * 360
                const endAngle = startAngle + sweep
                const path = describeArc(110, 110, 90, startAngle, endAngle)
                startAngle = endAngle
                return (
                  <path
                    key={entry.key}
                    d={path}
                    fill={entry.color}
                    stroke="#0b1220"
                    strokeWidth="2"
                    onMouseMove={(event) => showTooltip(event, entry)}
                    onMouseLeave={hideTooltip}
                  />
                )
              })
            )}
            <circle cx="110" cy="110" r="46" fill="#0b1220" stroke="#2b3a5a" strokeWidth="1" />
          </svg>
          {tooltip ? (
            <div className="pie-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
              <strong>{tooltip.label}</strong>
              <span>{tooltip.percent}%</span>
              <span>{tooltip.count} orders</span>
            </div>
          ) : null}
          <div className="pie-center">
            <strong>{total}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>

        <div className="pie-legend">
          {data.length === 0 ? (
            <p className="chart-empty">No orders available</p>
          ) : (
            data.map((entry) => (
              <div key={entry.key} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: entry.color }} />
                <span>{entry.label}</span>
                <strong>
                  {entry.percent}% ({entry.count})
                </strong>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  )
}

function PieChartsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeChart, setActiveChart] = useState('orders')

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError('')
      try {
        let page = 1
        const limit = 100
        let totalPages = 1
        const allOrders = []

        while (page <= totalPages) {
          const data = await adminApi.getOrders({ page, limit })
          const currentOrders = Array.isArray(data?.orders) ? data.orders : []
          allOrders.push(...currentOrders)
          totalPages = Number(data?.pagination?.totalPages || 1)
          page += 1
        }

        setOrders(allOrders)
      } catch (err) {
        setError(err.message || 'Failed to load pie chart data')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  const { orderData, paymentData } = useMemo(() => {
    const statusCounts = {}
    const paymentCounts = {}

    orders.forEach((order) => {
      const statusKey = String(order?.status || 'unknown').toLowerCase()
      const paymentKey = String(order?.payment?.method || 'unknown').toLowerCase()

      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1
      paymentCounts[paymentKey] = (paymentCounts[paymentKey] || 0) + 1
    })

    return {
      orderData: buildChartData(statusCounts, ORDER_STATUS_CONFIG),
      paymentData: buildChartData(paymentCounts, PAYMENT_METHOD_CONFIG),
    }
  }, [orders])

  const totalOrders = orders.length
  const isOrderChart = activeChart === 'orders'
  const activeTitle = isOrderChart ? 'Order Management' : 'Payment Methods'
  const activeData = isOrderChart ? orderData : paymentData

  return (
    <section className="page pie-page">
      <h2>Pie Charts</h2>
      {error ? <div className="auth-error">{error}</div> : null}
      {loading ? <p>Loading chart data...</p> : null}
      <div className="chip-group pie-switch">
        <button
          type="button"
          className={`chip ${isOrderChart ? 'active' : ''}`}
          onClick={() => setActiveChart('orders')}
        >
          Order Pie Chart
        </button>
        <button
          type="button"
          className={`chip ${!isOrderChart ? 'active' : ''}`}
          onClick={() => setActiveChart('payments')}
        >
          Payment Pie Chart
        </button>
      </div>
      <PieBlock title={activeTitle} data={activeData} total={totalOrders} centerLabel="Orders" />
    </section>
  )
}

export default PieChartsPage
