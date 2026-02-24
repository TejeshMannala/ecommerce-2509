import { getAdminToken } from '../utils/adminAuth'
import { fetchWithApiFallback, getApiBaseUrl } from '../config/apiBaseUrl'

const API_BASE_URL = getApiBaseUrl()

async function request(path, options = {}) {
  const token = getAdminToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
    console.log('Sending request with token to:', path)
  } else {
    console.warn('No admin token found for request to:', path)
  }

  let response
  let usedBaseUrl = API_BASE_URL
  try {
    const result = await fetchWithApiFallback(path, { ...options, headers })
    response = result.response
    usedBaseUrl = result.baseUrl
    
    console.log('Response status:', response.status, 'for path:', path)
    if (response.status === 401) {
      console.error('401 Unauthorized for path:', path)
      console.error('Headers sent:', headers)
      console.error('Token:', token)
    }
  } catch (_error) {
    throw new Error(`Cannot connect to API server (${usedBaseUrl}).`)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data
}

export const adminApi = {
  getProductCategories: async () => {
    const limit = 100
    let page = 1
    let totalPages = 1
    const categorySet = new Set()

    while (page <= totalPages) {
      const data = await request(`/admin/products?includeDeleted=true&page=${page}&limit=${limit}`)
      const products = Array.isArray(data?.products) ? data.products : []

      products.forEach((product) => {
        if (product?.category && String(product.category).trim()) {
          categorySet.add(String(product.category).trim())
        }
      })

      totalPages = Number(data?.pagination?.totalPages || 1)
      page += 1
    }

    return { categories: Array.from(categorySet).sort((a, b) => a.localeCompare(b)) }
  },
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/admin/products${query ? `?${query}` : ''}`)
  },
  createProduct: (payload) =>
    request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (id, payload) =>
    request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) =>
    request(`/admin/products/${id}`, {
      method: 'DELETE',
    }),
  uploadProductImage: async (file) => {
    const token = getAdminToken()
    const formData = new FormData()
    formData.append('image', file)

    const { response } = await fetchWithApiFallback('/admin/uploads/product-image', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || 'Image upload failed')
    }
    return data
  },

  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/admin/orders${query ? `?${query}` : ''}`)
  },
  updateOrderStatus: (id, payload) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/admin/users${query ? `?${query}` : ''}`)
  },
  getSupportMessages: () => request('/admin/support-messages'),
  replySupportMessage: (id, payload) =>
    request(`/admin/support-messages/${id}/reply`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
}
