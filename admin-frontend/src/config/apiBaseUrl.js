const LEGACY_BACKEND_HOST = 'ecommerce-2509-server.onrender.com'
const LEGACY_BACKEND_API_URL = 'https://ecommerce-2509-server.onrender.com/api'
const CURRENT_BACKEND_API_URL = 'https://ecommerce-api.onrender.com/api'
const API_SUFFIX = '/api'
const ABSOLUTE_HTTP_PATTERN = /^https?:\/\//i

const getConfiguredUrl = () => {
  const adminApiUrl = import.meta.env.VITE_ADMIN_API_URL
  const apiUrl = import.meta.env.VITE_API_URL
  const isDev = import.meta.env.DEV
  
  console.log('Environment variables debug:', {
    VITE_ADMIN_API_URL: adminApiUrl,
    VITE_API_URL: apiUrl,
    NODE_ENV: import.meta.env.NODE_ENV,
    DEV: isDev
  })
  
  // Force correct URL if we detect the old URL is being used
  const configuredUrl = (adminApiUrl && String(adminApiUrl).trim()) ||
    (apiUrl && String(apiUrl).trim()) ||
    (isDev ? 'http://localhost:5000/api' : CURRENT_BACKEND_API_URL)
  
  // If we detect the old URL, force the correct one
  if (configuredUrl && configuredUrl.includes('ecommerce-2509-server.onrender.com')) {
    console.warn('Detected old backend URL, forcing correct URL:', CURRENT_BACKEND_API_URL)
    return CURRENT_BACKEND_API_URL
  }
  
  return configuredUrl
}

const normalizeApiBaseUrl = (url) => {
  const cleaned = String(url || '').trim().replace(/\/+$/, '')
  if (!cleaned) return CURRENT_BACKEND_API_URL
  if (cleaned.endsWith(API_SUFFIX)) return cleaned
  return `${cleaned}${API_SUFFIX}`
}


export const getApiBaseUrl = () => {
  const configured = getConfiguredUrl()
  
  console.log('API Base URL Debug:', {
    configured,
    LEGACY_BACKEND_HOST,
    CURRENT_BACKEND_API_URL,
    isLegacy: configured && configured.includes(LEGACY_BACKEND_HOST),
    usingConfigured: configured && !configured.includes(LEGACY_BACKEND_HOST)
  })
  
  // If we have a configured URL and it's not the legacy URL, use it
  if (configured && !configured.includes(LEGACY_BACKEND_HOST)) {
    console.log('Using configured URL:', configured)
    return normalizeApiBaseUrl(configured)
  }
  
  // If configured URL is legacy or missing, use current backend URL
  console.log('Using current backend URL:', CURRENT_BACKEND_API_URL)
  return normalizeApiBaseUrl(CURRENT_BACKEND_API_URL)
}

export const getApiBaseUrlCandidates = () => {
  const configured = getConfiguredUrl()
  const candidates = [getApiBaseUrl()]
  
  // Only add fallback URLs if we're not already using the current backend URL
  if (configured !== CURRENT_BACKEND_API_URL) {
    candidates.push(CURRENT_BACKEND_API_URL)
  }
  
  // Only add legacy URL if we're in development or if explicitly configured
  const isDev = import.meta.env.DEV
  if (isDev || (configured && configured.includes(LEGACY_BACKEND_HOST))) {
    candidates.push(LEGACY_BACKEND_API_URL)
  }
  
  return Array.from(new Set(candidates))
}

const withTimeout = async (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    console.log('Making fetch request to:', url, 'with timeout:', timeoutMs)
    const response = await fetch(url, { ...options, signal: controller.signal })
    console.log('Fetch response received:', response.status, 'for URL:', url)
    return response
  } catch (error) {
    console.error('Fetch error for URL:', url, 'Error:', error.message, 'Error type:', error.constructor.name)
    
    // Provide more specific error messages
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      throw new Error(`Request timed out after ${timeoutMs}ms. Please check your internet connection and try again. (${url})`)
    } else if (error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to server. Please check your internet connection and try again. (${url})`)
    }
    
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const fetchWithApiFallback = async (path, options = {}, timeoutMs = 20000) => {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`
  const candidates = getApiBaseUrlCandidates()
  let lastError

  console.log('fetchWithApiFallback debug:', {
    path,
    normalizedPath,
    candidates,
    timeoutMs
  })

  for (const baseUrl of candidates) {
    try {
      console.log('Trying URL:', `${baseUrl}${normalizedPath}`)
      const response = await withTimeout(`${baseUrl}${normalizedPath}`, options, timeoutMs)
      console.log('Success with URL:', baseUrl)
      return { response, baseUrl }
    } catch (error) {
      console.error('Failed URL:', baseUrl, 'Error:', error.message, 'Error type:', error.constructor.name)
      lastError = error
    }
  }

  console.error('All URLs failed, throwing error:', lastError)
  throw lastError || new Error('Network request failed')
}
