import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="admin-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-main">
        <Navbar onMenuClick={openSidebar} />
        <main className="admin-content" onClick={closeSidebar}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
