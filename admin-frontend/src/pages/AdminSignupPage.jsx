import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated, setAdminSession } from '../utils/adminAuth'
import { fetchWithApiFallback } from '../config/apiBaseUrl'

function AdminSignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    loginUserName: '',
    password: '',
    confirmPassword: '',
  })
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
    if (!form.loginUserName.trim() || !form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError('Login username, name, email, password, and confirm password are required')
      return
    }
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { response } = await fetchWithApiFallback('/admin-auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to signup')
      }

      setAdminSession({ token: data.token, admin: data.admin })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Admin Signup</h2>
        <p>Create an admin account to manage the platform.</p>

        <label htmlFor="loginUserName">Login Username</label>
        <input
          id="loginUserName"
          name="loginUserName"
          value={form.loginUserName}
          onChange={onChange}
          placeholder="Enter login username"
        />

        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Enter admin name"
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Enter email address"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="Create password"
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={onChange}
          placeholder="Confirm password"
        />


        {error ? <div className="auth-error">{error}</div> : null}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Admin'}
        </button>

        <div className="auth-footer">
          Already have account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  )
}

export default AdminSignupPage
