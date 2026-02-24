const LEGACY_BACKEND_HOST = 'ecommerce-2509-server.onrender.com'
const CURRENT_BACKEND_API_URL = 'https://ecommerce-api.onrender.com/api'
const API_SUFFIX = '/api'

const getConfiguredUrl = () =>
  (import.meta.env.VITE_ADMIN_API_URL && String(import.meta.env.VITE_ADMIN_API_URL).trim()) ||
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : CURRENT_BACKEND_API_URL)

const normalizeApiBaseUrl = (url) => {
  const cleaned = String(url || '').trim().replace(/\/+$/, '')
  if (!cleaned) return CURRENT_BACKEND_API_URL
  if (cleaned.endsWith(API_SUFFIX)) return cleaned
  return `${cleaned}${API_SUFFIX}`
}

export const getApiBaseUrl = () => {
  const configured = getConfiguredUrl()
  const resolved = configured.includes(LEGACY_BACKEND_HOST) ? CURRENT_BACKEND_API_URL : configured
  return normalizeApiBaseUrl(resolved)
}
