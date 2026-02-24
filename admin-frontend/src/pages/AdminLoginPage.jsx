import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated, setAdminSession } from '../utils/adminAuth'
import { fetchWithApiFallback, getApiBaseUrl } from '../config/apiBaseUrl'

const API_BASE_URL = getApiBaseUrl()

function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ loginUserName: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (!form.loginUserName.trim() || !form.password) {
      setError('Login username and password are required')
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

        <label htmlFor="loginUserName">Login Username</label>
        <input
          id="loginUserName"
          name="loginUserName"
          value={form.loginUserName}
          onChange={onChange}
          placeholder="Enter login username"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="Enter password"
        />

        {error ? <div className="auth-error">{error}</div> : null}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="auth-footer">
          New admin? <Link to="/signup">Create account</Link>
        </div>
      </form>
    </div>
  )
}

export default AdminLoginPage
