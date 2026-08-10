import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import 'quill/dist/quill.snow.css'
import ImageResize from 'quill-image-resize-module'

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/imageResize', ImageResize)

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
  const [codeModal, setCodeModal] = useState(null)
  const [myRole, setMyRole] = useState('OWNER')

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

    const imageHandler = () => {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')
      input.click()
      input.onchange = () => {
        const file = input.files[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
          alert('Image too large. Please choose an image under 2MB.')
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          const range = quill.getSelection(true)
          quill.insertEmbed(range.index, 'image', reader.result, 'user')
          quill.setSelection(range.index + 1)
        }
        reader.readAsDataURL(file)
      }
    }
  const quill = new Quill(editorRef.current, {
      modules: {
        imageResize: {
          modules: ['Resize', 'DisplaySize'],
        },
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ color: [] }, { background: [] }],
            ['link', 'image'], ['clean'],
          ],
          handlers: { image: imageHandler },
        },
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
        quill.clipboard.dangerouslyPasteHTML(0, res.data.content)
      }
    })

    const cleanToken = token ? token.replace(/\/.*$/, '') : ''
    const wsBase = import.meta.env.VITE_WS_URL || 'wss://collab-platform-62rd.onrender.com'
    const wsUrl = wsBase + '/ws/collab/' + id + '?token=' + cleanToken

    const connectWS = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => { setConnected(true) }
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'room-state') {
            setOnlineUsers(msg.users || [])
          } else if (msg.type === 'user-joined') {
            setOnlineUsers(prev => [...prev, { userName: msg.userName, userColor: msg.userColor }])
            showToast(msg.userName + ' joined 🟢', 'join')
          } else if (msg.type === 'user-left') {
            setOnlineUsers(prev => prev.filter(u => u.userName !== msg.userName))
            showToast(msg.userName + ' left 🔴', 'leave')
          } else if (msg.type === 'doc-update' && msg.update) {
            const update = Uint8Array.from(atob(msg.update), c => c.charCodeAt(0))
            Y.applyUpdate(ydoc, update)
          } else if (msg.type === 'chat-message') {
            setChatMessages(prev => [...prev, {
              userName: msg.userName, userColor: msg.userColor, text: msg.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }])
            setChatOpen(prev => { if (!prev) setUnreadCount(c => c + 1); return prev })
          }
        } catch (e) { console.error('WS message error:', e) }
      }
      ws.onclose = () => { setConnected(false); setTimeout(connectWS, 2000) }
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
        api.patch('/documents/' + id + '/content', { content: quill.root.innerHTML })
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

  useEffect(() => {
    if (quillRef.current && isViewer) quillRef.current.disable()
  }, [isViewer, quillRef.current])

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'chat-message', text: chatInput.trim() }))
    setChatMessages(prev => [...prev, {
      userName: 'You', userColor: '#7c6aff', text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isMe: true,
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
  const saveStatusText = saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? '⟳ Saving...' : '● Unsaved'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', fontFamily: 'Outfit, sans-serif' }}>

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: toast.type === 'join' ? '#0d1f0d' : '#1f0d0d',
            border: `1px solid ${toast.type === 'join' ? '#2ecc71' : '#e74c3c'}`,
            color: toast.type === 'join' ? '#2ecc71' : '#e74c3c',
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)', animation: 'slideIn 0.3s ease',
            minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .chat-input:focus { outline: none; border-color: #7c6aff !important; box-shadow: 0 0 0 3px rgba(124,106,255,0.15) !important; }
        .ql-toolbar { border: none !important; border-bottom: 1px solid var(--border) !important; background: var(--bg-secondary) !important; padding: 8px 16px !important; }
        .ql-container { border: none !important; font-size: 15px !important; }
        .ql-editor { padding: 32px 48px !important; min-height: calc(100vh - 120px) !important; line-height: 1.8 !important; color: var(--text-primary) !important; }
        .ql-editor.ql-blank::before { color: var(--text-muted) !important; font-style: normal !important; }
        .ql-disabled .ql-editor { background: transparent !important; cursor: default !important; }
@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: fixed; top: 0; left: 0; width: 100%; }
  .ql-toolbar { display: none !important; }
}
        .ai-action-btn:hover { background: rgba(124,106,255,0.15) !important; border-color: rgba(124,106,255,0.4) !important; }
        .header-btn:hover { background: var(--bg-card) !important; }
      `}</style>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
          <button className="header-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, padding: '5px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          {editingTitle && !isViewer ? (
            <input style={{ background: 'var(--bg-hover)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, padding: '4px 10px', fontFamily: 'Outfit, sans-serif', outline: 'none', flex: 1, letterSpacing: '-0.3px' }}
              value={title} onChange={e => setTitle(e.target.value)} onBlur={handleTitleBlur} onKeyDown={e => e.key === 'Enter' && handleTitleBlur()} autoFocus />
          ) : (
            <h1 style={{ fontSize: 15, fontWeight: 700, cursor: isViewer ? 'default' : 'pointer', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}
              onClick={() => !isViewer && setEditingTitle(true)}>
              {title || 'Untitled Document'}
            </h1>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isViewer && (
              <span style={{ fontSize: 11, background: 'rgba(243,156,18,0.15)', color: '#f39c12', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>👁 View Only</span>
            )}
            {!isViewer && (
              <span style={{ fontSize: 11, color: saveStatusColor, fontWeight: 500 }}>{saveStatusText}</span>
            )}
            <span style={{ fontSize: 11, color: connected ? '#2ecc71' : '#e74c3c', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#2ecc71' : '#e74c3c', display: 'inline-block' }} />
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Online users */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {onlineUsers.slice(0, 4).map((u, i) => (
              <div key={i} title={u.userName} style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, border: '2px solid var(--bg-secondary)', color: '#fff', background: u.userColor || '#7c6aff', marginLeft: i > 0 ? -6 : 0, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {u.userName ? u.userName[0].toUpperCase() : '?'}
              </div>
            ))}
            {onlineUsers.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{onlineUsers.length} online</span>}
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

          {/* Chat button */}
          <button className="header-btn" style={{ position: 'relative', background: chatOpen ? 'rgba(124,106,255,0.2)' : 'none', color: chatOpen ? '#7c6aff' : 'var(--text-secondary)', border: chatOpen ? '1px solid rgba(124,106,255,0.3)' : '1px solid transparent', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, transition: 'all 0.15s' }}
            onClick={() => { setChatOpen(!chatOpen); setAiOpen(false); setUnreadCount(0) }}>
            💬 Chat
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#e74c3c', color: '#fff', borderRadius: '50%', width: 17, height: 17, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* AI button */}
          <button className="header-btn" style={{ background: aiOpen ? 'rgba(124,106,255,0.2)' : 'none', color: aiOpen ? '#7c6aff' : 'var(--text-secondary)', border: aiOpen ? '1px solid rgba(124,106,255,0.3)' : '1px solid transparent', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500, transition: 'all 0.15s' }}
            onClick={() => { setAiOpen(!aiOpen); setChatOpen(false) }}>
            🤖 AI
          </button>

          {/* Share button */}
<button style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}
  onClick={() => {
    document.title = title
    window.print()
  }}>
  📄 Export PDF
</button>
          {myRole === 'OWNER' && (
            <button style={{ background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, boxShadow: '0 2px 8px rgba(124,106,255,0.3)' }}
              onClick={() => api.post('/documents/' + id + '/generate-code').then(res => setCodeModal(res.data)).catch(() => alert('Failed to generate code'))}>
              🔑 Share
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="print-area" ref={editorRef} style={{ flex: 1 }} />
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <aside style={{ width: 300, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💬</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Live Chat</span>
                {onlineUsers.length > 0 && <span style={{ fontSize: 10, background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 10, padding: '1px 6px' }}>{onlineUsers.length} online</span>}
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 2 }} onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 32 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages yet. Say hi!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                  {!msg.isMe && <span style={{ fontSize: 11, color: msg.userColor || '#7c6aff', fontWeight: 700, marginBottom: 3 }}>{msg.userName}</span>}
                  <div style={{
                    background: msg.isMe ? 'linear-gradient(135deg, #7c6aff, #5b4de8)' : 'var(--bg-card)',
                    color: msg.isMe ? '#fff' : 'var(--text-primary)',
                    border: msg.isMe ? 'none' : '1px solid var(--border)',
                    borderRadius: msg.isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '8px 12px', fontSize: 13, maxWidth: '85%', lineHeight: 1.5, wordBreak: 'break-word',
                    boxShadow: msg.isMe ? '0 2px 8px rgba(124,106,255,0.3)' : 'none',
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input className="chat-input"
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, padding: '8px 12px', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s' }}
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              />
              <button style={{ background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(124,106,255,0.3)' }} onClick={sendChatMessage}>➤</button>
            </div>
          </aside>
        )}

        {/* AI Panel */}
        {aiOpen && (
          <aside style={{ width: 300, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🤖</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>AI Assistant</span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 2 }} onClick={() => setAiOpen(false)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Select text in the editor, then choose an action:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'summarize', label: '📋 Summarize', desc: 'Condense into key points' },
                  { id: 'rephrase', label: '✏️ Rephrase', desc: 'Rewrite more clearly' },
                  { id: 'continue', label: '➡️ Continue', desc: 'Generate next paragraph' },
                  { id: 'grammar', label: '✓ Fix Grammar', desc: 'Correct errors' },
                  { id: 'shorten', label: '✂️ Shorten', desc: 'Make it concise' },
                  { id: 'bullets', label: '• Bulletize', desc: 'Convert to bullet list' },
                ].map(action => (
                  <button key={action.id} className="ai-action-btn"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column', gap: 2, transition: 'all 0.15s' }}
                    onClick={() => handleAI(action.id)} disabled={aiLoading}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.desc}</span>
                  </button>
                ))}
              </div>

              {aiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: '#7c6aff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Thinking...</span>
                </div>
              )}

            </div>
          </aside>
        )}
       {/* AI Result Panel */}
        {(aiResult || aiLoading) && (
          <aside style={{ width: 340, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Result</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 2 }} onClick={() => setAiResult('')}>X</button>
            </div>
            {aiLoading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, border: '2px solid var(--border)', borderTopColor: '#7c6aff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Thinking...</span>
              </div>
            ) : (
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', padding: 16, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{aiResult}</div>
            )}
           {!aiLoading && (
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button style={{ flex: 1, background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff', border: 'none', borderRadius: 6, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                onClick={() => { const quill = quillRef.current; if (quill) { const sel = quill.getSelection() || { index: quill.getLength(), length: 0 }; quill.insertText(sel.index + sel.length, '\n' + aiResult) } }}>
                Insert
              </button>
              <button style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                onClick={() => { navigator.clipboard.writeText(aiResult); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                {copied ? 'Copied' : 'Copy'}
             </button>
            </div>
            )}
          </aside>
        )}
      </div>

      {/* Share Code Modal */}
      {codeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 360, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>🔑 Share Document</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }} onClick={() => setCodeModal(null)}>✕</button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Share these codes with collaborators to give them access.</p>

            {/* Editor Code */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c6aff', letterSpacing: '0.08em' }}>EDITOR CODE</span>
                <button style={{ background: 'rgba(124,106,255,0.15)', color: '#7c6aff', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}
                  onClick={() => { navigator.clipboard.writeText(codeModal.editor_code); alert('🔑 Editor code copied!') }}>Copy</button>
              </div>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: 6, fontFamily: 'monospace' }}>{codeModal.editor_code}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Can edit and collaborate on the document</p>
            </div>

            {/* Viewer Code */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f39c12', letterSpacing: '0.08em' }}>VIEWER CODE</span>
                <button style={{ background: 'rgba(243,156,18,0.15)', color: '#f39c12', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}
                  onClick={() => { navigator.clipboard.writeText(codeModal.viewer_code); alert('👁 Viewer code copied!') }}>Copy</button>
              </div>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: 6, fontFamily: 'monospace' }}>{codeModal.viewer_code}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Can only read the document</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
