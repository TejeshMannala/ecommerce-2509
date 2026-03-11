const ADMIN_TOKEN_KEY = 'adminToken'
const ADMIN_KEY = 'admin'

const decodeTokenPayload = (token) => {
  try {
    const parts = String(token).split('.')
    if (parts.length !== 3) return null

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const isTokenExpired = (token) => {
  const payload = decodeTokenPayload(token)
  if (!payload?.exp) return false
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return Number(payload.exp) <= nowInSeconds
}

export const getAdminToken = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || ''
  if (!token) return ''

  if (isTokenExpired(token)) {
    clearAdminSession()
    return ''
  }

  return token
}

export const isAdminAuthenticated = () => Boolean(getAdminToken())

export const setAdminSession = ({ token, admin }) => {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}
