function Navbar({ onMenuClick }) {
  return (
    <header className="navbar">
      <button className="menu-button" type="button" onClick={onMenuClick}>
        Menu
      </button>
      <div className="navbar-title">
        <h1>Admin Dashboard</h1>
        <p>Manage products, orders, and support messages</p>
      </div>
      <div className="admin-badge">Admin</div>
    </header>
  )
}

export default Navbar
