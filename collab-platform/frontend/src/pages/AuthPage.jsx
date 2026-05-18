import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register(form.name, form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      const msg = typeof err === 'string' ? err.toLowerCase() : ''
if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
  setError('Incorrect password. Please try again.')
} else if (msg.includes('not found') || msg.includes('no account') || msg.includes('user')) {
  setError('No account found with this email.')
} else if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
  setError('An account with this email already exists.')
} else {
  setError('Something went wrong. Please try again.')
}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-5deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .auth-input:focus {
          border-color: #7c6aff !important;
          box-shadow: 0 0 0 3px rgba(124,106,255,0.15) !important;
          outline: none !important;
        }
        .auth-btn:hover { background: #6a58e8 !important; transform: translateY(-1px); }
        .auth-btn:active { transform: translateY(0); }
        .switch-btn:hover { text-decoration: underline; }
        .feature-item { transition: transform 0.2s; }
        .feature-item:hover { transform: translateX(4px); }
      `}</style>

      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>⚡</div>
            <span style={styles.brandName}>Collab</span>
          </div>
          <h2 style={styles.leftTitle}>The future of<br /><span style={styles.gradientText}>collaborative writing</span></h2>
          <p style={styles.leftSubtitle}>Real-time editing, AI assistance, and seamless teamwork — all in one place.</p>
          <div style={styles.features}>
            {[
              { icon: '⚡', text: 'Real-time collaboration' },
              { icon: '🤖', text: 'AI writing assistant' },
              { icon: '💬', text: 'Built-in live chat' },
              { icon: '🔒', text: 'Secure access control' },
            ].map((f, i) => (
              <div key={i} className="feature-item" style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Floating blobs */}
        <div style={{ ...styles.blob, top: '10%', right: '-5%', animationName: 'float1', animationDuration: '6s', animationIterationCount: 'infinite' }} />
        <div style={{ ...styles.blob, bottom: '15%', left: '-8%', width: 200, height: 200, background: 'rgba(46,204,113,0.12)', animationName: 'float2', animationDuration: '8s', animationIterationCount: 'infinite' }} />
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.tabRow}>
            <button style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }} onClick={() => { setIsLogin(true); setError('') }}>Sign in</button>
            <button style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }} onClick={() => { setIsLogin(false); setError('') }}>Sign up</button>
          </div>

          <h1 style={styles.title}>{isLogin ? 'Welcome back 👋' : 'Create account 🚀'}</h1>
          <p style={styles.subtitle}>{isLogin ? 'Sign in to your workspace' : 'Start collaborating in real-time'}</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLogin && (
              <div style={styles.field}>
                <label style={styles.label}>Full name</label>
                <input className="auth-input" style={styles.input} type="text" placeholder="Lucky Singh"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input className="auth-input" style={styles.input} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input className="auth-input" style={styles.input} type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>

            {error && (
              <div style={styles.error}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button className="auth-btn" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Please wait...
                </span>
              ) : (isLogin ? 'Sign in →' : 'Create account →')}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          <p style={styles.switchText}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button className="switch-btn" style={styles.switchBtn} onClick={() => { setIsLogin(!isLogin); setError('') }}>
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    background: 'var(--bg-primary)',
    fontFamily: 'Outfit, sans-serif',
  },
  leftPanel: {
    flex: 1, background: 'linear-gradient(135deg, #1a1730 0%, #0f0f1a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
    borderRight: '1px solid rgba(124,106,255,0.15)',
  },
  leftContent: { position: 'relative', zIndex: 1, maxWidth: 400 },
  brandRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 },
  brandIcon: {
    width: 40, height: 40, background: 'linear-gradient(135deg, #7c6aff, #5b4de8)',
    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
    boxShadow: '0 4px 16px rgba(124,106,255,0.4)',
  },
  brandName: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
  leftTitle: { fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' },
  gradientText: { background: 'linear-gradient(135deg, #7c6aff, #2ecc71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  leftSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 40 },
  features: { display: 'flex', flexDirection: 'column', gap: 14 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12 },
  featureIcon: { width: 36, height: 36, background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  featureText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(124,106,255,0.1)', filter: 'blur(40px)', pointerEvents: 'none' },
  rightPanel: {
    width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 40px', background: 'var(--bg-primary)',
  },
  card: { width: '100%', maxWidth: 400, animation: 'fadeIn 0.4s ease' },
  tabRow: { display: 'flex', background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, marginBottom: 28, border: '1px solid var(--border)' },
  tab: { flex: 1, padding: '8px', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'none', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s' },
  tabActive: { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(124,106,255,0.4)' },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' },
  input: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '11px 14px', color: 'var(--text-primary)',
    fontSize: 14, fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s',
    boxShadow: 'none',
  },
  error: {
    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
    borderRadius: 8, padding: '10px 14px', color: '#e74c3c', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  btn: {
    background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff', border: 'none',
    borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 4, fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(124,106,255,0.3)',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerText: { fontSize: 12, color: 'var(--text-muted)' },
  switchText: { textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' },
  switchBtn: { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif' },
}