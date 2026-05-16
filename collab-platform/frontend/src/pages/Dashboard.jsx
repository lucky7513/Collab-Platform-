import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../utils/api'

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents')
      setDocuments(res.data)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async () => {
    setCreating(true)
    try {
      const res = await api.post('/documents')
      navigate('/document/' + res.data.id)
    } catch (err) {
      console.error('Failed to create document:', err)
    } finally {
      setCreating(false)
    }
  }

  const deleteDocument = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete('/documents/' + id)
      setDocuments(docs => docs.filter(d => d.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Just now'
      const diff = Date.now() - date.getTime()
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (mins < 1) return 'Just now'
      if (mins < 60) return mins + ' mins ago'
      if (hours < 24) return hours + ' hours ago'
      return days + ' days ago'
    } catch {
      return 'Just now'
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Collab</span>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif', marginBottom: 8 }} onClick={createDocument} disabled={creating}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          {creating ? 'Creating...' : 'New Document'}
        </button>

        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 4 }}>WORKSPACE</p>
          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)' }}>📄 All Documents</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/memories')}>🖼️ Memories</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div><div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-sec</div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, background: user?.avatarColor || 'var(--accent)' }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }} onClick={logout} title="Sign out">↗</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>My Documents</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
          </div>
          <button style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif' }} onClick={createDocument} disabled={creating}>
           + New Document</button><button style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif' }} onClick={() => { const code = window.prompt('Enter 6-digit room code:'); if (code) { api.get('/documents/join/' + code.toUpperCase()).then(res => navigate('/document/' + res.data.document_id)).catch(() => alert('Invalid code!')) } }}>🔗 Join with Code
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>📝</div>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>No documents yet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create your first document and start collaborating</p>
            <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 8, fontFamily: 'Outfit, sans-serif' }} onClick={createDocument}>
              Create Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, cursor: 'pointer', display: 'flex', gap: 14, transition: 'border-color 0.2s' }}
                onClick={() => navigate('/document/' + doc.id)}
              >
                <div style={{ fontSize: 28, flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title || 'Untitled Document'}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.content ? doc.content.substring(0, 80) + '...' : 'Empty document'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(doc.updatedAt)}</span>
                    <button
                      style={{ background: '#e74c3c', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}
                      onClick={(e) => deleteDocument(e, doc.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
