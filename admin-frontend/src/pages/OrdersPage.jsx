import { useEffect, useState } from 'react'
import { adminApi } from '../api/adminApi'

const statuses = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
  'failed',
]

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [drawerStatus, setDrawerStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getOrders()
      setOrders(Array.isArray(data?.orders) ? data.orders : [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const updateStatus = async (id, status) => {
    try {
      setSaving(true)
      await adminApi.updateOrderStatus(id, { status })
      await loadOrders()
      closeDetails()
    } catch (err) {
      setError(err.message || 'Failed to update order status')
    } finally {
      setSaving(false)
    }
  }

  const openDetails = (order) => {
    setSelectedOrder(order)
    setDrawerStatus(order.status || 'pending')
  }

  const closeDetails = () => {
    setSelectedOrder(null)
    setDrawerStatus('')
  }

  const formatDateTime = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString()
  }

  return (
    <section className="page">
      <h2>Orders</h2>
      <article className="panel">
        <h3>Order Management</h3>
        <p>Track and update order statuses with live admin APIs.</p>
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="table-placeholder">
          <div className="row header row-6">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Total</span>
            <span>Status</span>
            <span>Date & Time</span>
            <span>Details</span>
          </div>
          {loading ? (
            <div className="row row-6">
              <span>Loading...</span>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : orders.length === 0 ? (
            <div className="row row-6">
              <span>No orders found</span>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            orders.map((order) => (
              <div className="row row-6" key={order._id}>
                <span>{order.orderId}</span>
                <span>{order.user?.name || order.shippingAddress?.fullName || '-'}</span>
                <span>${order.total}</span>
                <span>{order.status}</span>
                <span>{formatDateTime(order.createdAt)}</span>
                <span>
                  <button className="table-btn" type="button" onClick={() => openDetails(order)}>
                    View
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </article>

      {selectedOrder ? (
        <>
          <div className="drawer-overlay" onClick={closeDetails} />
          <aside className="order-drawer">
            <div className="drawer-head">
              <h3>Order Details</h3>
              <button className="close-button" type="button" onClick={closeDetails}>
                X
              </button>
            </div>

            <div className="detail-grid">
              <span>Order ID</span>
              <strong>{selectedOrder.orderId || '-'}</strong>
              <span>Status</span>
              <strong>{selectedOrder.status || '-'}</strong>
              <span>Total</span>
              <strong>${selectedOrder.total ?? '-'}</strong>
              <span>Created At</span>
              <strong>{formatDateTime(selectedOrder.createdAt)}</strong>
            </div>

            <h4>Update Status</h4>
            <div className="drawer-actions">
              <select value={drawerStatus} onChange={(event) => setDrawerStatus(event.target.value)}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                className="table-btn primary"
                type="button"
                disabled={saving || drawerStatus === selectedOrder.status}
                onClick={() => updateStatus(selectedOrder._id, drawerStatus)}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            <h4>Customer</h4>
            <div className="detail-grid">
              <span>Name</span>
              <strong>{selectedOrder.shippingAddress?.fullName || '-'}</strong>
              <span>Email</span>
              <strong>{selectedOrder.shippingAddress?.email || '-'}</strong>
              <span>Phone</span>
              <strong>{selectedOrder.shippingAddress?.phone || '-'}</strong>
            </div>

            <h4>Shipping Address</h4>
            <div className="detail-grid">
              <span>Address</span>
              <strong>{selectedOrder.shippingAddress?.address || '-'}</strong>
              <span>City/State</span>
              <strong>
                {selectedOrder.shippingAddress?.city || '-'}, {selectedOrder.shippingAddress?.state || '-'}
              </strong>
              <span>Zip/Country</span>
              <strong>
                {selectedOrder.shippingAddress?.zipCode || '-'}, {selectedOrder.shippingAddress?.country || '-'}
              </strong>
            </div>

            <h4>Billing Address</h4>
            <div className="detail-grid">
              <span>Address</span>
              <strong>{selectedOrder.billingAddress?.address || '-'}</strong>
              <span>City/State</span>
              <strong>
                {selectedOrder.billingAddress?.city || '-'}, {selectedOrder.billingAddress?.state || '-'}
              </strong>
              <span>Zip/Country</span>
              <strong>
                {selectedOrder.billingAddress?.zipCode || '-'}, {selectedOrder.billingAddress?.country || '-'}
              </strong>
            </div>

            <h4>Payment</h4>
            <div className="detail-grid">
              <span>Method</span>
              <strong>{selectedOrder.payment?.method || '-'}</strong>
              <span>Status</span>
              <strong>{selectedOrder.payment?.status || '-'}</strong>
              <span>Amount</span>
              <strong>${selectedOrder.payment?.amount ?? selectedOrder.total ?? '-'}</strong>
            </div>

            <h4>Items</h4>
            <div className="drawer-items">
              {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item, index) => (
                  <p key={`${selectedOrder._id}-${index}`}>
                    {item.name} x {item.quantity} (${item.price})
                  </p>
                ))
              ) : (
                <p>No items found</p>
              )}
            </div>

            {selectedOrder.notes ? (
              <>
                <h4>Note</h4>
                <p className="drawer-note">{selectedOrder.notes}</p>
              </>
            ) : null}
          </aside>
        </>
      ) : null}
    </section>
  )
}

export default OrdersPage
