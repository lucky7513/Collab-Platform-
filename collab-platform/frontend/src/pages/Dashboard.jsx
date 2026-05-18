import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../utils/api'

const DOC_COLORS = ['#7c6aff', '#2ecc71', '#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#1abc9c', '#e67e22']

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { fetchDocuments() }, [])

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
    if (!window.confirm('Delete this document permanently?')) return
    try {
      await api.delete('/documents/' + id)
      setDocuments(docs => docs.filter(d => d.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const leaveDocument = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Leave this document? You will lose access.')) return
    try {
      await api.delete('/documents/' + id + '/leave')
      setDocuments(docs => docs.filter(d => d.id !== id))
    } catch (err) {
      console.error('Failed to leave:', err)
    }
  }

  const joinWithCode = async () => {
    const code = window.prompt('Enter 6-digit room code:')
    if (!code) return
    try {
      const res = await api.get('/documents/join/' + code.toUpperCase())
      navigate('/document/' + res.data.document_id)
    } catch (err) {
      alert('Invalid code! Please try again.')
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const getDocColor = (id) => DOC_COLORS[id ? id.charCodeAt(0) % DOC_COLORS.length : 0]
  const isOwner = (doc) => user && doc.owner_email === user.email

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
      if (mins < 60) return mins + 'm ago'
      if (hours < 24) return hours + 'h ago'
      return days + 'd ago'
    } catch { return 'Just now' }
  }

  const filtered = documents.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.content?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .doc-card { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important; }
        .doc-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important; border-color: rgba(124,106,255,0.4) !important; }
        .sidebar-btn:hover { background: var(--bg-hover) !important; }
        .search-input:focus { outline: none; border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(124,106,255,0.1) !important; }
        .action-btn:hover { opacity: 0.85 !important; transform: scale(0.97); }
      `}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>⚡</div>
          <span style={styles.logoText}>Collab</span>
        </div>

        <div style={styles.sidebarSection}>
          <button style={styles.newDocBtn} onClick={createDocument} disabled={creating}>
            <span style={styles.newDocPlus}>+</span>
            {creating ? 'Creating...' : 'New Document'}
          </button>
          <button className="sidebar-btn" style={styles.sidebarBtn} onClick={joinWithCode}>
            <span>🔗</span> Join with Code
          </button>
        </div>

        <div style={styles.sidebarSection}>
          <p style={styles.sectionLabel}>WORKSPACE</p>
          <div style={styles.sidebarActive}>
            <span>📁</span> All Documents
            <span style={styles.docCount}>{documents.length}</span>
          </div>
        </div>

        <div style={styles.sidebarBottom}>
          <div style={styles.userAvatar}>
            {getInitials(user?.name)}
          </div>
          <div style={styles.userInfo}>
            <p style={styles.userName}>{user?.name || ''}</p>
            <p style={styles.userEmail}>{user?.email || ''}</p>
          </div>
          <button style={styles.logoutBtn} onClick={logout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.mainHeader}>
          <div>
            <h1 style={styles.mainTitle}>My Documents</h1>
            <p style={styles.mainSubtitle}>{filtered.length} of {documents.length} documents</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>🔍</span>
              <input className="search-input" style={styles.searchInput} placeholder="Search documents..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={styles.newDocBtnTop} onClick={createDocument}>+ New</button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>📝</div>
            <h2 style={styles.emptyTitle}>{search ? 'No results found' : 'No documents yet'}</h2>
            <p style={styles.emptySubtitle}>{search ? 'Try a different search term' : 'Create your first document to get started'}</p>
            {!search && (
              <button style={styles.emptyBtn} onClick={createDocument}>Create Document</button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((doc, idx) => (
              <div key={doc.id} className="doc-card" style={styles.card} onClick={() => navigate('/document/' + doc.id)}>
                {/* Card top accent */}
                <div style={{ ...styles.cardAccent, background: getDocColor(doc.id) }} />
                <div style={styles.cardBody}>
                  <div style={styles.cardIcon}>
                    <span style={{ fontSize: 20 }}>📄</span>
                  </div>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{doc.title || 'Untitled Document'}</h3>
                    {!isOwner(doc) && (
                      <span style={styles.sharedBadge}>Shared by {doc.owner_name}</span>
                    )}
                    <p style={styles.cardPreview}>{doc.content ? doc.content.substring(0, 90) + '...' : 'Empty document'}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.cardDate}>🕐 {formatDate(doc.updated_at)}</span>
                      {isOwner(doc) ? (
                        <button className="action-btn" style={styles.deleteBtn}
                          onClick={(e) => deleteDocument(e, doc.id)}>Delete</button>
                      ) : (
                        <button className="action-btn" style={styles.leaveBtn}
                          onClick={(e) => leaveDocument(e, doc.id)}>Leave</button>
                      )}
                    </div>
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
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Outfit, sans-serif' },
  sidebar: {
    width: 250, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '20px 12px', flexShrink: 0,
  },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 24 },
  logoIcon: {
    width: 32, height: 32, background: 'linear-gradient(135deg, #7c6aff, #5b4de8)',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
    boxShadow: '0 2px 8px rgba(124,106,255,0.4)',
  },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' },
  sidebarSection: { marginBottom: 24 },
  newDocBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff',
    border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
    marginBottom: 6, boxShadow: '0 2px 8px rgba(124,106,255,0.3)',
    transition: 'all 0.2s',
  },
  newDocPlus: { fontSize: 18, lineHeight: 1, fontWeight: 300 },
  sidebarBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13,
    fontFamily: 'Outfit, sans-serif', transition: 'background 0.15s',
  },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', padding: '0 8px', marginBottom: 6 },
  sidebarActive: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.2)',
    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
  },
  docCount: {
    marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
    fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px',
  },
  sidebarBottom: {
    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 8px', borderTop: '1px solid var(--border)',
  },
  userAvatar: {
    width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6aff, #5b4de8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 },
  main: { flex: 1, padding: '32px 40px', overflow: 'auto' },
  mainHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  mainTitle: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 },
  mainSubtitle: { color: 'var(--text-muted)', fontSize: 13 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 10, fontSize: 13, pointerEvents: 'none' },
  searchInput: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px 8px 32px', color: 'var(--text-primary)', fontSize: 13,
    fontFamily: 'Outfit, sans-serif', width: 200, transition: 'all 0.2s',
  },
  newDocBtnTop: {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
  },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 },
  spinner: { width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyWrap: { textAlign: 'center', paddingTop: 80, animation: 'fadeIn 0.4s ease' },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  emptySubtitle: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 },
  emptyBtn: {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
    cursor: 'pointer', overflow: 'hidden', animation: 'fadeIn 0.3s ease',
  },
  cardAccent: { height: 4, width: '100%' },
  cardBody: { padding: '16px 18px', display: 'flex', gap: 12 },
  cardIcon: {
    width: 40, height: 40, background: 'var(--bg-secondary)', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardContent: { flex: 1, overflow: 'hidden' },
  cardTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sharedBadge: { fontSize: 10, color: '#7c6aff', background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 4, padding: '1px 6px', display: 'inline-block', marginBottom: 4 },
  cardPreview: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { fontSize: 11, color: 'var(--text-muted)' },
  deleteBtn: {
    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
    borderRadius: 5, color: '#e74c3c', cursor: 'pointer', padding: '3px 10px',
    fontSize: 11, fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
  },
  leaveBtn: {
    background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
    borderRadius: 5, color: '#7c6aff', cursor: 'pointer', padding: '3px 10px',
    fontSize: 11, fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
  },
}