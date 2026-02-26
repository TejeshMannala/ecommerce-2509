const KNOWN_BACKEND_API_URLS = [
  'https://ecommerce-2509.vercel.app/api',
]
const API_SUFFIX = '/api'
const ABSOLUTE_HTTP_PATTERN = /^https?:\/\//i

const getConfiguredUrl = () =>
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : KNOWN_BACKEND_API_URLS[0])

const normalizeApiBaseUrl = (url) => {
  const cleaned = String(url || '').trim().replace(/\/+$/, '')
  if (!cleaned) return KNOWN_BACKEND_API_URLS[0]
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

export const getApiBaseUrlCandidates = () => {
  const configured = getConfiguredUrl()
  const normalizedConfigured = normalizeApiBaseUrl(configured)
  const known = KNOWN_BACKEND_API_URLS.map((url) => normalizeApiBaseUrl(url))
  return Array.from(new Set([normalizedConfigured, ...known]))
}

export const getApiBaseUrl = () => {
  const configured = getConfiguredUrl()
  const safeResolved = shouldForceBackendUrl(configured) ? KNOWN_BACKEND_API_URLS[0] : configured
  return normalizeApiBaseUrl(safeResolved)
}