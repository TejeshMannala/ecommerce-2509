const LEGACY_BACKEND_HOST = 'ecommerce-2509-server.onrender.com'
const CURRENT_BACKEND_API_URL = 'https://ecommerce-api.onrender.com/api'

const getConfiguredUrl = () =>
  (import.meta.env.VITE_ADMIN_API_URL && String(import.meta.env.VITE_ADMIN_API_URL).trim()) ||
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

export const getApiBaseUrl = () => {
  const configured = getConfiguredUrl()
  return configured.includes(LEGACY_BACKEND_HOST) ? CURRENT_BACKEND_API_URL : configured
}

