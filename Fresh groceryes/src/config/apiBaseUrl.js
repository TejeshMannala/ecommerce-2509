const LEGACY_BACKEND_HOST = 'ecommerce-2509-server.onrender.com'
const CURRENT_BACKEND_API_URL = 'https://ecommerce-api.onrender.com/api'
const API_SUFFIX = '/api'
const ABSOLUTE_HTTP_PATTERN = /^https?:\/\//i

const getConfiguredUrl = () =>
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : CURRENT_BACKEND_API_URL)

const normalizeApiBaseUrl = (url) => {
  const cleaned = String(url || '').trim().replace(/\/+$/, '')
  if (!cleaned) return CURRENT_BACKEND_API_URL
  if (cleaned.endsWith(API_SUFFIX)) return cleaned
  return `${cleaned}${API_SUFFIX}`
}

const shouldForceBackendUrl = (url) => {
  if (!url) return true
  if (!ABSOLUTE_HTTP_PATTERN.test(url)) return !import.meta.env.DEV

  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(url).origin === window.location.origin
    } catch (_error) {
      return true
    }
  }

  return false
}

export const getApiBaseUrl = () => {
  const configured = getConfiguredUrl()
  const resolved = configured.includes(LEGACY_BACKEND_HOST) ? CURRENT_BACKEND_API_URL : configured
  const safeResolved = shouldForceBackendUrl(resolved) ? CURRENT_BACKEND_API_URL : resolved
  return normalizeApiBaseUrl(safeResolved)
}

