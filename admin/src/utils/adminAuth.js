const ADMIN_TOKEN_KEY = 'adminToken'
const ADMIN_KEY = 'admin'

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || ''

export const isAdminAuthenticated = () => Boolean(getAdminToken())

export const setAdminSession = ({ token, admin }) => {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}
