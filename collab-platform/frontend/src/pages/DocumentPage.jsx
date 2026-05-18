

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

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const ydocRef = useRef(null)
  const wsRef = useRef(null)
  const saveTimerRef = useRef(null)
  const chatEndRef = useRef(null)

  const [title, setTitle] = useState('Untitled Document')
  const [editingTitle, setEditingTitle] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [saveStatus, setSaveStatus] = useState('saved')
  const [connected, setConnected] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [toasts, setToasts] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [myRole, setMyRole] = useState('OWNER') // OWNER, EDITOR, VIEWER

  const isViewer = myRole === 'VIEWER'

  const showToast = (message, type = 'join') => {
    const toastId = Date.now()
    setToasts(prev => [...prev, { id: toastId, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000)
  }

  useEffect(() => {
    api.get('/documents/' + id)
      .then(res => setTitle(res.data.title))
      .catch(() => navigate('/dashboard'))
    // Fetch user's role for this document
    api.get('/documents/' + id + '/my-role')
      .then(res => setMyRole(res.data.role))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [chatOpen])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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

    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const ytext = ydoc.getText('quill')
    new QuillBinding(ytext, quill)

    api.get('/documents/' + id).then(res => {
      if (res.data.content && res.data.content.trim() && ytext.length === 0) {
        ytext.insert(0, res.data.content)
      }
    })

    const cleanToken = token ? token.replace(/\/.*$/, '') : ''
    const wsBase = import.meta.env.VITE_WS_URL || 'wss://collab-platform-62rd.onrender.com'
    const wsUrl = wsBase + '/ws/collab/' + id + '?token=' + cleanToken

    const connectWS = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => { console.log('WS connected!'); setConnected(true) }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'room-state') {
            setOnlineUsers(msg.users || [])
          } else if (msg.type === 'user-joined') {
            setOnlineUsers(prev => [...prev, { userName: msg.userName, userColor: msg.userColor }])
            showToast(msg.userName + ' joined the document 🟢', 'join')
          } else if (msg.type === 'user-left') {
            setOnlineUsers(prev => prev.filter(u => u.userName !== msg.userName))
            showToast(msg.userName + ' left the document 🔴', 'leave')
          } else if (msg.type === 'doc-update' && msg.update) {
            const update = Uint8Array.from(atob(msg.update), c => c.charCodeAt(0))
            Y.applyUpdate(ydoc, update)
          } else if (msg.type === 'chat-message') {
            setChatMessages(prev => [...prev, {
              userName: msg.userName,
              userColor: msg.userColor,
              text: msg.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }])
            setChatOpen(prev => {
              if (!prev) setUnreadCount(c => c + 1)
              return prev
            })
          }
        } catch (e) { console.error('WS message error:', e) }
      }

      ws.onclose = () => { console.log('WS closed, reconnecting...'); setConnected(false); setTimeout(connectWS, 2000) }
      ws.onerror = (e) => console.error('WS error:', e)
    }

    connectWS()

    ydoc.on('update', (update, origin) => {
      if (origin === 'remote') return
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        const encoded = btoa(String.fromCharCode(...update))
        ws.send(JSON.stringify({ type: 'doc-update', update: encoded }))
      }
    })

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source !== 'user') return
      setSaveStatus('unsaved')
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving')
        api.patch('/documents/' + id + '/content', { content: quill.getText() })
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

  // Disable editor for viewers
  useEffect(() => {
    if (quillRef.current && isViewer) {
      quillRef.current.disable()
    }
  }, [isViewer, quillRef.current])

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'chat-message', text: chatInput.trim() }))
    setChatMessages(prev => [...prev, {
      userName: 'You',
      userColor: '#7c6aff',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    }])
    setChatInput('')
  }

  const handleTitleBlur = async () => {
    setEditingTitle(false)
    if (title.trim()) await api.patch('/documents/' + id + '/title', { title })
  }

  const handleAI = async (action) => {
    const quill = quillRef.current
    if (!quill) return
    const selection = quill.getSelection()
    const text = selection && selection.length > 0 ? quill.getText(selection.index, selection.length) : quill.getText()
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

  const saveStatusColor = saveStatus === 'saved' ? '#2ecc71' : saveStatus === 'saving' ? '#f39c12' : '#e74c3c'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: toast.type === 'join' ? '#1a2e1a' : '#2e1a1a',
            border: `1px solid ${toast.type === 'join' ? '#2ecc71' : '#e74c3c'}`,
            color: toast.type === 'join' ? '#2ecc71' : '#e74c3c',
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease', minWidth: 220,
          }}>
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .chat-input:focus { outline: none; border-color: var(--accent) !important; }
        .ql-disabled .ql-editor { background: var(--bg-primary) !important; cursor: default !important; }
      `}</style>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, overflow: 'hidden' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', padding: '4px 8px' }} onClick={() => navigate('/dashboard')}>Back</button>
          {editingTitle && !isViewer ? (
            <input style={{ background: 'var(--bg-hover)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, padding: '4px 10px', fontFamily: 'Outfit, sans-serif', outline: 'none', flex: 1 }} value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleBlur} onKeyDown={e => e.key === 'Enter' && handleTitleBlur()} autoFocus />
          ) : (
            <h1 style={{ fontSize: 16, fontWeight: 600, cursor: isViewer ? 'default' : 'pointer', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => !isViewer && setEditingTitle(true)}>{title || 'Untitled Document'}</h1>
          )}
          {isViewer && (
            <span style={{ fontSize: 11, background: '#2e2a1a', color: '#f39c12', border: '1px solid #f39c12', borderRadius: 4, padding: '2px 8px' }}>👁 View Only</span>
          )}
          {!isViewer && <span style={{ fontSize: 12, color: saveStatusColor }}>{saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}</span>}
          <span style={{ fontSize: 11, color: connected ? '#2ecc71' : '#e74c3c' }}>{connected ? '● Live' : '○ Connecting...'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {onlineUsers.slice(0, 5).map((u, i) => (
              <div key={i} title={u.userName} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border: '2px solid var(--bg-secondary)', color: '#fff', background: u.userColor || '#7c6aff', marginLeft: i > 0 ? -8 : 0 }}>
                {u.userName ? u.userName[0].toUpperCase() : '?'}
              </div>
            ))}
            {onlineUsers.length > 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{onlineUsers.length} online</span>}
          </div>

          <button style={{ position: 'relative', background: chatOpen ? 'var(--accent)' : 'var(--bg-hover)', color: chatOpen ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif' }}
            onClick={() => { setChatOpen(!chatOpen); setAiOpen(false); setUnreadCount(0) }}>
            💬 Chat
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#e74c3c', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif' }}
            onClick={() => { setAiOpen(!aiOpen); setChatOpen(false) }}>AI Assistant</button>

          {myRole === 'OWNER' && (
            <button style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif' }}
              onClick={() => {
               api.post('/documents/' + id + '/generate-code').then(res => {
                  const ec = res.data.editor_code; const vc = res.data.viewer_code
                  const choice = window.confirm('🔑 Editor Code: ' + ec + '\n👁 Viewer Code: ' + vc + '\n\nClick OK to copy Editor code, Cancel to copy Viewer code')
                  if (choice) { navigator.clipboard.writeText(ec); alert('🔑 Editor code copied!') }
                  else { navigator.clipboard.writeText(vc); alert('👁 Viewer code copied!') }
                }).catch(() => alert('Failed to generate code'))
              }}>
              🔑 Get Room Code
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div ref={editorRef} />
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <aside style={{ width: 300, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>💬 Live Chat</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }} onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>No messages yet. Say hi! 👋</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                  {!msg.isMe && (
                    <span style={{ fontSize: 11, color: msg.userColor || '#7c6aff', fontWeight: 600, marginBottom: 3 }}>{msg.userName}</span>
                  )}
                  <div style={{
                    background: msg.isMe ? 'var(--accent)' : 'var(--bg-card)',
                    color: msg.isMe ? '#fff' : 'var(--text-primary)',
                    border: msg.isMe ? 'none' : '1px solid var(--border)',
                    borderRadius: msg.isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '8px 12px', fontSize: 13, maxWidth: '85%', lineHeight: 1.4, wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input className="chat-input"
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, padding: '8px 12px', fontFamily: 'Outfit, sans-serif' }}
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              />
              <button style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 16 }} onClick={sendChatMessage}>➤</button>
            </div>
          </aside>
        )}

        {/* AI Panel */}
        {aiOpen && (
          <aside style={{ width: 300, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>AI Assistant</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }} onClick={() => setAiOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Select text then choose an action:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[{id:'summarize',label:'Summarize'},{id:'rephrase',label:'Rephrase'},{id:'continue',label:'Continue'},{id:'grammar',label:'Fix Grammar'},{id:'shorten',label:'Shorten'},{id:'bullets',label:'Bulletize'}].map(action => (
                <button key={action.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} onClick={() => handleAI(action.id)} disabled={aiLoading}>{action.label}</button>
              ))}
            </div>
            {aiLoading && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Thinking...</p>}
            {aiResult && !aiLoading && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{aiResult}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }} onClick={() => { const quill = quillRef.current; if (quill) { const sel = quill.getSelection() || { index: quill.getLength(), length: 0 }; quill.insertText(sel.index + sel.length, '\n' + aiResult) } }}>Insert</button>
                  <button style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }} onClick={() => { navigator.clipboard.writeText(aiResult); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}