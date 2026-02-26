const KNOWN_BACKEND_API_URLS = [
  'https://ecommerce-api.onrender.com/api',
  'https://ecommerce-2509.onrender.com/api',
  'https://ecommerce-2509-server.onrender.com/api',
]
const API_SUFFIX = '/api'
const ABSOLUTE_HTTP_PATTERN = /^https?:\/\//i

const getConfiguredUrl = () => {
  const adminApiUrl = import.meta.env.VITE_ADMIN_API_URL
  const apiUrl = import.meta.env.VITE_API_URL
  return (adminApiUrl && String(adminApiUrl).trim()) ||
    (apiUrl && String(apiUrl).trim()) ||
    (import.meta.env.DEV ? 'http://localhost:5000/api' : KNOWN_BACKEND_API_URLS[0])
}

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

export const getApiBaseUrl = () => {
  const configured = getConfiguredUrl()
  const safeResolved = shouldForceBackendUrl(configured) ? KNOWN_BACKEND_API_URLS[0] : configured
  return normalizeApiBaseUrl(safeResolved)
}

export const getApiBaseUrlCandidates = () => {
  const configured = getConfiguredUrl()
  const normalizedConfigured = normalizeApiBaseUrl(configured)
  if (!import.meta.env.DEV) {
    // In production, fail fast on the configured backend.
    return [normalizedConfigured]
  }
  const known = KNOWN_BACKEND_API_URLS.map((url) => normalizeApiBaseUrl(url))
  return Array.from(new Set([normalizedConfigured, ...known]))
}

const withTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      throw new Error(`Request timed out after ${timeoutMs}ms. Backend may be unavailable. (${url})`)
    }
    if (error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to server. Please check your internet connection and try again. (${url})`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const fetchWithApiFallback = async (path, options = {}, timeoutMs = 10000) => {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`
  const candidates = getApiBaseUrlCandidates()
  let lastError

  for (const baseUrl of candidates) {
    try {
      const response = await withTimeout(`${baseUrl}${normalizedPath}`, options, timeoutMs)
      return { response, baseUrl }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Network request failed')
}
