import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isAdminAuthenticated, setAdminSession } from '../utils/adminAuth'

const API_BASE_URL =
  (import.meta.env.VITE_ADMIN_API_URL && String(import.meta.env.VITE_ADMIN_API_URL).trim()) ||
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

function AdminSignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
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
    if (!form.name.trim() || !form.loginUserName.trim() || !form.password || !form.confirmPassword) {
      setError('All fields are required')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/admin-auth/signup`, {
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

        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Enter admin name"
        />

        <label htmlFor="loginUserName">Login Username</label>
        <input
          id="loginUserName"
          name="loginUserName"
          value={form.loginUserName}
          onChange={onChange}
          placeholder="Choose login username"
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
