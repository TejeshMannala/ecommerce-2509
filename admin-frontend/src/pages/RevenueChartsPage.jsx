import { useMemo, useState } from 'react'

const datasets = {
  weekly: [
    { label: 'Mon', value: 24 },
    { label: 'Tue', value: 41 },
    { label: 'Wed', value: 35 },
    { label: 'Thu', value: 50 },
    { label: 'Fri', value: 46 },
    { label: 'Sat', value: 63 },
    { label: 'Sun', value: 57 },
  ],
  monthly: [
    { label: 'W1', value: 170 },
    { label: 'W2', value: 210 },
    { label: 'W3', value: 190 },
    { label: 'W4', value: 245 },
  ],
  halfYearly: [
    { label: 'Jan', value: 620 },
    { label: 'Feb', value: 710 },
    { label: 'Mar', value: 760 },
    { label: 'Apr', value: 830 },
    { label: 'May', value: 890 },
    { label: 'Jun', value: 960 },
  ],
}

function RevenueChartsPage() {
  const [range, setRange] = useState('weekly')
  const points = datasets[range]

  const chart = useMemo(() => {
    const width = 760
    const height = 260
    const padX = 44
    const padY = 24
    const max = Math.max(...points.map((point) => point.value))
    const min = Math.min(...points.map((point) => point.value))
    const span = Math.max(1, max - min)
    const stepX = (width - padX * 2) / (points.length - 1)
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

  return (
    <section className="page">
      <h2>Revenue Charts</h2>
      <article className="panel chart-panel">
        <div className="chart-head">
          <h3>Revenue Trend</h3>
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
        <div className="chart-wrap">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="line-chart"
            role="img"
            aria-label="Revenue line chart"
          >
            <defs>
              <linearGradient id="revGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
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
              points={`${chart.mapped[0].x},${chart.height - chart.padY} ${chart.polyline} ${chart.mapped[chart.mapped.length - 1].x},${chart.height - chart.padY}`}
              fill="url(#revGradient)"
              stroke="none"
            />
            <polyline points={chart.polyline} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
            {chart.mapped.map((point) => (
              <g key={point.label}>
                <circle cx={point.x} cy={point.y} r="5" fill="#0b1220" stroke="#93c5fd" strokeWidth="2" />
                <text x={point.x} y={chart.height - 7} textAnchor="middle" className="chart-label">
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </article>
    </section>
  )
}

export default RevenueChartsPage
