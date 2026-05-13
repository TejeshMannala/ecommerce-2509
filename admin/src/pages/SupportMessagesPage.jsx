import { useEffect, useState } from 'react'
import { adminApi } from '../api/adminApi'

function SupportMessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyById, setReplyById] = useState({})
  const [sendingId, setSendingId] = useState('')

  const loadMessages = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getSupportMessages()
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
    } catch (err) {
      setError(err.message || 'Failed to load support messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const sendReply = async (message) => {
    const reply = String(replyById[message._id] || '').trim()
    if (!reply) {
      setError('Reply message is required')
      return
    }

    try {
      setSendingId(message._id)
      setError('')
      await adminApi.replySupportMessage(message._id, { adminReply: reply, status: 'in_progress' })
      setReplyById((prev) => ({ ...prev, [message._id]: '' }))
      await loadMessages()
    } catch (err) {
      setError(err.message || 'Failed to send reply')
    } finally {
      setSendingId('')
    }
  }

  return (
    <section className="page">
      <h2>Support Messages</h2>
      <article className="panel">
        <h3>Customer Support Inbox</h3>
        <p>Messages submitted by users from frontend contact form.</p>
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="message-list">
          {loading ? (
            <div className="message-item">
              <h4>Loading...</h4>
            </div>
          ) : messages.length === 0 ? (
            <div className="message-item">
              <h4>No support messages found</h4>
            </div>
          ) : (
            messages.map((item) => (
              <div className="message-item" key={item._id}>
                <h4>{item.subject}</h4>
                <p>Name: {item.name}</p>
                <p>Email: {item.email}</p>
                <p>Mobile: {item.mobile}</p>
                <p>Message: {item.message}</p>
                {item.adminReply ? <p>Admin Reply: {item.adminReply}</p> : null}
                <span className={`pill ${item.status === 'in_progress' ? 'in-progress' : ''}`}>
                  {item.status || 'new'}
                </span>
                <div className="support-reply-box">
                  <textarea
                    value={replyById[item._id] || ''}
                    onChange={(event) =>
                      setReplyById((prev) => ({ ...prev, [item._id]: event.target.value }))
                    }
                    rows={3}
                    placeholder="Type reply to this user..."
                  />
                  <button
                    className="table-btn primary"
                    type="button"
                    disabled={sendingId === item._id}
                    onClick={() => sendReply(item)}
                  >
                    {sendingId === item._id ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  )
}

export default SupportMessagesPage
