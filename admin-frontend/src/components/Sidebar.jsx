import { NavLink, useNavigate } from 'react-router-dom'
import { clearAdminSession } from '../utils/adminAuth'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Products', to: '/products' },
  { label: 'Orders', to: '/orders' },
  { label: 'Users', to: '/users' },
  { label: 'Support Messages', to: '/support-messages' },
  { label: 'Revenue Charts', to: '/revenue-charts' },
  { label: 'Pie Charts', to: '/pie-charts' },
]

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAdminSession()
    navigate('/login')
    onClose()
  }

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button className="close-button" type="button" onClick={onClose}>
            X
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      {isOpen ? <div className="sidebar-overlay" onClick={onClose} /> : null}
    </>
  )
}

export default Sidebar
