import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../utils/api'
import { formatDistanceToNow } from 'date-fns'

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
      navigate(`/document/${res.data.id}`)
    } catch (err) {
      console.error('Failed to create document:', err)
    } finally {
      setCreating(false)
    }
  }

  const deleteDocument = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${id}`)
      setDocuments(docs => docs.filter(d => d.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚡</div>
          <span style={styles.logoText}>Collab</span>
        </div>

        <button style={styles.newDocBtn} onClick={createDocument} disabled={creating}>
          <span style={styles.plusIcon}>+</span>
          {creating ? 'Creating...' : 'New Document'}
        </button>

        <div style={styles.sidebarSection}>
          <p style={styles.sidebarLabel}>WORKSPACE</p>
          <div style={styles.sidebarItem}>📄 All Documents</div>
        </div>

        <div style={styles.userSection}>
          <div style={{...styles.avatar, background: user?.avatarColor || 'var(--accent)'}}>
            {getInitials(user?.name)}
          </div>
          <div style={styles.userInfo}>
            <p style={styles.userName}>{user?.name}</p>
            <p style={styles.userEmail}>{user?.email}</p>
          </div>
          <button style={styles.logoutBtn} onClick={logout} title="Sign out">↗</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>My Documents</h1>
            <p style={styles.subheading}>{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
          </div>
          <button style={styles.headerNewBtn} onClick={createDocument} disabled={creating}>
            + New Document
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <div style={styles.loadingDots}>
              <span /><span /><span />
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📝</div>
            <h2 style={styles.emptyTitle}>No documents yet</h2>
            <p style={styles.emptyText}>Create your first document and start collaborating</p>
            <button style={styles.emptyBtn} onClick={createDocument}>
              Create Document
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {documents.map((doc, i) => (
              <div
                key={doc.id}
                style={{...styles.card, animationDelay: `${i * 0.05}s`}}
                className="fade-in"
                onClick={() => navigate(`/document/${doc.id}`)}
              >
                <div style={styles.cardIcon}>📄</div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{doc.title || 'Untitled Document'}</h3>
                  <p style={styles.cardMeta}>
                    {doc.content ? doc.content.substring(0, 80) + '...' : 'Empty document'}
                  </p>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardDate}>
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </span>
                    <button
                      style={styles.deleteBtn}
                      onClick={(e) => deleteDocument(e, doc.id)}
                    >
                      🗑
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

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' },
  sidebar: {
    width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
    padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 16 },
  logoIcon: {
    width: 30, height: 30, background: 'var(--accent-dim)', border: '1px solid var(--accent)',
    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
  },
  logoText: { fontSize: 18, fontWeight: 700 },
  newDocBtn: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
    marginBottom: 8,
  },
  plusIcon: { fontSize: 18, lineHeight: 1 },
  sidebarSection: { marginTop: 8 },
  sidebarLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 4 },
  sidebarItem: {
    padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--accent-dim)',
  },
  userSection: {
    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 8px', borderTop: '1px solid var(--border)',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 },
  main: { flex: 1, padding: '40px 48px', overflow: 'auto' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 },
  heading: { fontSize: 28, fontWeight: 700, marginBottom: 4 },
  subheading: { color: 'var(--text-secondary)', fontSize: 14 },
  headerNewBtn: {
    background: 'var(--bg-card)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500,
    fontFamily: 'Outfit, sans-serif',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: 20, cursor: 'pointer', display: 'flex', gap: 14,
    transition: 'border-color 0.2s, transform 0.2s',
    animationFillMode: 'both',
  },
  cardIcon: { fontSize: 28, flexShrink: 0 },
  cardBody: { flex: 1, overflow: 'hidden' },
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardMeta: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { fontSize: 11, color: 'var(--text-muted)' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.5, padding: 2 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, textAlign: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 600 },
  emptyText: { color: 'var(--text-secondary)', fontSize: 14 },
  emptyBtn: {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
    padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 8,
    fontFamily: 'Outfit, sans-serif',
  },
  loadingDots: { display: 'flex', gap: 8 },
}
