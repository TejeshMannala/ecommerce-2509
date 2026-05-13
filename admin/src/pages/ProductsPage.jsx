import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../api/adminApi'

const initialForm = {
  name: '',
  description: '',
  price: 50,
  category: '',
  sku: '',
  status: 'active',
  imageUrl: '',
}

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageMode, setImageMode] = useState('url')
  const [imageFile, setImageFile] = useState(null)
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 7,
    totalPages: 1,
  })
  const [form, setForm] = useState(initialForm)

  const title = useMemo(
    () => (editingId ? 'Edit Product' : 'Create Product'),
    [editingId]
  )

  const loadProducts = async (targetPage = page) => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getProducts({
        page: String(targetPage),
        limit: '7',
      })
      setProducts(Array.isArray(data?.products) ? data.products : [])
      setPagination({
        total: Number(data?.pagination?.total || 0),
        limit: Number(data?.pagination?.limit || 7),
        totalPages: Number(data?.pagination?.totalPages || 1),
      })
      setPage(Number(data?.pagination?.page || targetPage))
    } catch (err) {
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await adminApi.getProductCategories()
      const list = Array.isArray(data?.categories) ? data.categories : []
      setCategories(list)
      setForm((prev) => ({
        ...prev,
        category: prev.category || list[0] || '',
      }))
    } catch (err) {
      setError(err.message || 'Failed to load categories')
    }
  }

  useEffect(() => {
    loadProducts(page)
  }, [page])

  useEffect(() => {
    loadCategories()
  }, [])

  const resetForm = () => {
    setForm({
      ...initialForm,
      category: categories[0] || '',
    })
    setEditingId('')
    setImageMode('url')
    setImageFile(null)
    setIsModalOpen(false)
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: name === 'price' ? Number(value) : value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      let finalImageUrl = form.imageUrl?.trim()
      if (imageMode === 'file') {
        if (!imageFile) {
          throw new Error('Please select an image file')
        }
        const upload = await adminApi.uploadProductImage(imageFile)
        finalImageUrl = upload?.url || ''
      }

      if (!finalImageUrl) {
        throw new Error('Image URL is required')
      }

      const payload = {
        ...form,
        images: [{ url: finalImageUrl, alt: form.name, isPrimary: true }],
        inventory: { quantity: 10, lowStockThreshold: 2, trackInventory: true },
      }
      if (editingId) {
        await adminApi.updateProduct(editingId, payload)
      } else {
        await adminApi.createProduct(payload)
      }
      resetForm()
      await loadProducts(page)
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (product) => {
    setEditingId(product._id)
    setIsModalOpen(true)
    setImageMode('url')
    setImageFile(null)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: Number(product.price || 50),
      category: product.category || categories[0] || '',
      sku: product.sku || '',
      status: product.status || 'active',
      imageUrl: product.images?.[0]?.url || '',
    })
  }

  const onDelete = async (id) => {
    try {
      await adminApi.deleteProduct(id)
      const nextPage = products.length === 1 && page > 1 ? page - 1 : page
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await loadProducts(nextPage)
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product')
    }
  }

  return (
    <section className="page">
      <h2>Products</h2>
      <article className="panel">
        <h3>Product Management</h3>
        <p>Create, update, and delete products with live database data.</p>
        <button className="table-btn primary" type="button" onClick={() => setIsModalOpen(true)}>
          Create Product
        </button>

        {error ? <div className="auth-error">{error}</div> : null}

        <div className="table-placeholder">
          <div className="row header">
            <span>Name</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {loading ? (
            <div className="row">
              <span>Loading...</span>
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : products.length === 0 ? (
            <div className="row">
              <span>No products found</span>
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            products.map((product) => (
              <div className="row row-5" key={product._id}>
                <span>{product.name}</span>
                <span>{product.category}</span>
                <span>${product.price}</span>
                <span>{product.status}</span>
                <span className="row-actions">
                  <button className="table-btn" type="button" onClick={() => onEdit(product)}>
                    Edit
                  </button>
                  <button className="table-btn danger" type="button" onClick={() => onDelete(product._id)}>
                    Delete
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
        <div className="pagination">
          <button
            className="table-btn"
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {pagination.totalPages} (Total: {pagination.total})
          </span>
          <button
            className="table-btn"
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </article>

      {isModalOpen ? (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <form className="crud-form" onSubmit={onSubmit}>
              <h4>{title}</h4>
              <label className="form-field">
                <span>Product Name</span>
                <input name="name" placeholder="Product Name" value={form.name} onChange={onChange} required />
              </label>
              <label className="form-field">
                <span>Description</span>
                <input
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={onChange}
                  required
                />
              </label>
              <label className="form-field">
                <span>Price</span>
                <input
                  name="price"
                  type="number"
                  min="50"
                  max="500"
                  value={form.price}
                  onChange={onChange}
                  required
                />
              </label>
              <label className="form-field">
                <span>Category</span>
                <select name="category" value={form.category} onChange={onChange}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>SKU</span>
                <input name="sku" placeholder="SKU" value={form.sku} onChange={onChange} required />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select name="status" value={form.status} onChange={onChange}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="discontinued">discontinued</option>
                </select>
              </label>

              <div className="image-mode">
                <label>
                  <input
                    type="radio"
                    name="imageMode"
                    value="url"
                    checked={imageMode === 'url'}
                    onChange={() => setImageMode('url')}
                  />
                  Image URL
                </label>
                <label>
                  <input
                    type="radio"
                    name="imageMode"
                    value="file"
                    checked={imageMode === 'file'}
                    onChange={() => setImageMode('file')}
                  />
                  Upload File
                </label>
              </div>

              {imageMode === 'url' ? (
                <label className="form-field form-field-full">
                  <span>Image URL</span>
                  <input
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={onChange}
                    required
                  />
                </label>
              ) : (
                <label className="form-field form-field-full">
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    required
                  />
                </label>
              )}

              <div className="crud-actions">
                <button className="table-btn primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                <button className="table-btn danger" type="button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ProductsPage
