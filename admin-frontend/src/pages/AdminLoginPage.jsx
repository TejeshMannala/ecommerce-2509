import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated, setAdminSession } from '../utils/adminAuth'
import { fetchWithApiFallback } from '../config/apiBaseUrl'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAdminAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { response } = await fetchWithApiFallback('/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to login')
      }

      setAdminSession({ token: data.token, admin: data.admin })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Admin Login</h2>
        <p>Sign in to access the admin dashboard.</p>

        <label htmlFor="email">Email or Username</label>
        <input
          id="email"
          name="email"
          type="text"
          value={form.email}
          onChange={onChange}
          placeholder="Enter email or username"
        />

        <label htmlFor="password">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={onChange}
            placeholder="Enter password"
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ 
              position: 'absolute', 
              right: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showPassword ? '🔒' : '👁️'}
          </button>
        </div>

        {error ? <div className="auth-error">{error}</div> : null}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="auth-footer">
          New admin? <Link to="/signup">Create account</Link>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
          You can login with either your email address or username
        </div>
      </form>
    </div>
  )
}

export default AdminLoginPage
