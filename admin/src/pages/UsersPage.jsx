import { useEffect, useState } from 'react'
import { adminApi } from '../api/adminApi'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getUsers()
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <section className="page">
      <h2>Users</h2>
      <article className="panel">
        <h3>User List</h3>
        <p>View users from database with name and email.</p>
        {error ? <div className="auth-error">{error}</div> : null}

        <div className="table-placeholder">
          <div className="row header">
            <span>Name</span>
            <span>Email</span>
            <span>Created At</span>
          </div>
          {loading ? (
            <div className="row row-3">
              <span>Loading...</span>
              <span />
              <span />
            </div>
          ) : users.length === 0 ? (
            <div className="row row-3">
              <span>No users found</span>
              <span />
              <span />
            </div>
          ) : (
            users.map((user) => (
              <div className="row row-3" key={user._id}>
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  )
}

export default UsersPage
