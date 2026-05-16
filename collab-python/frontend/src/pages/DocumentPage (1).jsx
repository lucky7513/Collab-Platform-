import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import 'quill/dist/quill.snow.css'

Quill.register('modules/cursors', QuillCursors)

const AI_ACTIONS = [
  { id: 'summarize', label: 'Summarize', desc: 'Condense into key points' },
  { id: 'rephrase',  label: 'Rephrase',  desc: 'Rewrite more clearly' },
  { id: 'continue', label: 'Continue',   desc: 'Generate next paragraph' },
  { id: 'grammar',  label: 'Fix Grammar', desc: 'Correct errors' },
  { id: 'shorten',  label: 'Shorten',    desc: 'Make it concise' },
  { id: 'bullets',  label: 'Bulletize',  desc: 'Convert to bullet list' },
]

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const ydocRef = useRef(null)
  const wsRef = useRef(null)
  const saveTimerRef = useRef(null)

  const [title, setTitle] = useState('Untitled Document')
  const [editingTitle, setEditingTitle] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [saveStatus, setSaveStatus] = useState('saved')
  const [connected, setConnected] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/documents/' + id)
      .then(res => setTitle(res.data.title))
      .catch(() => navigate('/dashboard'))
  }, [id])

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return

    const quill = new Quill(editorRef.current, {
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ color: [] }, { background: [] }],
          ['link'], ['clean'],
        ],
        cursors: { transformOnTextChange: true },
        history: { userOnly: true },
      },
      placeholder: 'Start writing...',
      theme: 'snow',
    })

    quillRef.current = quill

    // Yjs document
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const ytext = ydoc.getText('quill')

    // Bind Yjs to Quill
    new QuillBinding(ytext, quill)

    // Clean token
    const cleanToken = token ? token.replace(/\/.*$/, '') : ''
    const wsUrl = 'ws://127.0.0.1:8000/ws/collab/' + id + '?token=' + cleanToken

    // Plain WebSocket connection
    const connectWS = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected!')
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'room-state') {
            setOnlineUsers(msg.users || [])
          } else if (msg.type === 'user-joined') {
            setOnlineUsers(prev => [...prev, { userName: msg.userName, userColor: msg.userColor }])
          } else if (msg.type === 'user-left') {
            setOnlineUsers(prev => prev.filter(u => u.userName !== msg.userName))
          } else if (msg.type === 'doc-update' && msg.update) {
            // Apply Yjs update from other clients
            const update = Uint8Array.from(atob(msg.update), c => c.charCodeAt(0))
            Y.applyUpdate(ydoc, update)
          }
        } catch (e) {
          console.error('WS message error:', e)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting in 2s...')
        setConnected(false)
        setTimeout(connectWS, 2000)
      }

      ws.onerror = (e) => {
        console.error('WebSocket error:', e)
      }
    }

    connectWS()

    // Send Yjs updates to other clients
    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        const encoded = btoa(String.fromCharCode(...update))
        ws.send(JSON.stringify({ type: 'doc-update', update: encoded }))
      }
    })

    // Auto-save
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source !== 'user') return
      setSaveStatus('unsaved')
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const content = quill.getText()
        setSaveStatus('saving')
        api.patch('/documents/' + id + '/content', { content })
          .then(() => setSaveStatus('saved'))
          .catch(() => setSaveStatus('unsaved'))
      }, 2000)
    })

    return () => {
      if (wsRef.current) wsRef.current.close()
      ydoc.destroy()
      clearTimeout(saveTimerRef.current)
    }
  }, [id, token])

  const handleTitleBlur = async () => {
    setEditingTitle(false)
    if (title.trim()) {
      await api.patch('/documents/' + id + '/title', { title })
    }
  }

  const handleAI = async (action) => {
    const quill = quillRef.current
    if (!quill) return
    const selection = quill.getSelection()
    const text = selection && selection.length > 0
      ? quill.getText(selection.index, selection.length)
      : quill.getText()
    if (!text.trim()) return
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await api.post('/ai/process', { action, text })
      setAiResult(res.data.result)
    } catch (err) {
      setAiResult('AI service unavailable.')
    } finally {
      setAiLoading(false)
    }
  }

  const insertAiResult = () => {
    const quill = quillRef.current
    if (!quill || !aiResult) return
    const sel = quill.getSelection() || { index: quill.getLength(), length: 0 }
    quill.insertText(sel.index + sel.length, '\n' + aiResult)
  }

  const copyAiResult = () => {
    navigator.clipboard.writeText(aiResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied!')
  }

  const saveStatusColor = saveStatus === 'saved' ? '#2ecc71' : saveStatus === 'saving' ? '#f39c12' : '#e74c3c'

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>Back</button>
          {editingTitle ? (
            <input
              style={styles.titleInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={e => e.key === 'Enter' && handleTitleBlur()}
              autoFocus
            />
          ) : (
            <h1 style={styles.titleDisplay} onClick={() => setEditingTitle(true)}>
              {title || 'Untitled Document'}
            </h1>
          )}
          <span style={{ fontSize: 12, color: saveStatusColor }}>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
          <span style={{ fontSize: 11, color: connected ? '#2ecc71' : '#e74c3c' }}>
            {connected ? '● Live' : '○ Connecting...'}
          </span>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.usersRow}>
            {onlineUsers.slice(0, 5).map((u, i) => (
              <div key={i} title={u.userName} style={{ ...styles.userDot, background: u.userColor || '#7c6aff', marginLeft: i > 0 ? -8 : 0 }}>
                {u.userName ? u.userName[0].toUpperCase() : '?'}
              </div>
            ))}
            {onlineUsers.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{onlineUsers.length} online</span>
            )}
          </div>
          <button style={styles.aiBtn} onClick={() => setAiOpen(!aiOpen)}>AI Assistant</button>
          <button style={styles.shareBtn} onClick={shareLink}>Share</button>
        </div>
      </header>

      <div style={styles.body}>
        <div style={styles.editorWrap}>
          <div ref={editorRef} />
        </div>

        {aiOpen && (
          <aside style={styles.aiSidebar}>
            <div style={styles.aiHeader}>
              <span style={{ fontWeight: 700 }}>AI Assistant</span>
              <button style={styles.closeBtn} onClick={() => setAiOpen(false)}>X</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Select text then choose an action:</p>
            <div style={styles.aiActions}>
              {AI_ACTIONS.map(action => (
                <button key={action.id} style={styles.aiAction} onClick={() => handleAI(action.id)} disabled={aiLoading}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{action.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.desc}</span>
                </button>
              ))}
            </div>
            {aiLoading && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Thinking...</p>}
            {aiResult && !aiLoading && (
              <div style={styles.aiResult}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Result</p>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiResult}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={styles.insertBtn} onClick={insertAiResult}>Insert</button>
                  <button style={styles.copyBtn} onClick={copyAiResult}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 56, background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 12,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, overflow: 'hidden' },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: 13, fontFamily: 'Outfit, sans-serif', padding: '4px 8px',
  },
  titleInput: {
    background: 'var(--bg-hover)', border: '1px solid var(--accent)', borderRadius: 6,
    color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, padding: '4px 10px',
    fontFamily: 'Outfit, sans-serif', outline: 'none', flex: 1,
  },
  titleDisplay: { fontSize: 16, fontWeight: 600, cursor: 'pointer', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  usersRow: { display: 'flex', alignItems: 'center', gap: 4 },
  userDot: {
    width: 28, height: 28, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
    border: '2px solid var(--bg-secondary)', color: '#fff',
  },
  aiBtn: {
    background: 'var(--accent-dim)', color: 'var(--accent-light)',
    border: '1px solid rgba(124,106,255,0.3)', borderRadius: 6,
    padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif',
  },
  shareBtn: {
    background: 'var(--bg-hover)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 6,
    padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  editorWrap: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' },
  aiSidebar: {
    width: 300, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflow: 'auto',
  },
  aiHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 },
  aiActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  aiAction: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex',
    flexDirection: 'column', gap: 2, fontFamily: 'Outfit, sans-serif',
  },
  aiResult: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 8, padding: 12,
  },
  insertBtn: {
    flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 6, padding: '8px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
  },
  copyBtn: {
    background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
  },
}
