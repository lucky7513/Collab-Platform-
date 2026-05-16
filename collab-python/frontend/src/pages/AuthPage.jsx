import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

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
      setError(err || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Background effects */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.card} className="fade-in">
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚡</div>
          <span style={styles.logoText}>Collab</span>
        </div>

        <h1 style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</h1>
        <p style={styles.subtitle}>
          {isLogin ? 'Sign in to your workspace' : 'Start collaborating in real-time'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Lucky Singh"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <p style={styles.switchText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button style={styles.switchBtn} onClick={() => { setIsLogin(!isLogin); setError('') }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', top: '-20%', left: '-10%',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,106,255,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', bottom: '-20%', right: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(46,204,113,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '44px 40px',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    boxShadow: 'var(--shadow)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoIcon: {
    width: 36, height: 36, background: 'var(--accent-dim)', border: '1px solid var(--accent)',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
  },
  logoText: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' },
  title: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' },
  input: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    color: 'var(--text-primary)', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Outfit, sans-serif',
  },
  error: {
    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    color: '#e74c3c', fontSize: 13,
  },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 4, fontFamily: 'Outfit, sans-serif',
    transition: 'background 0.2s',
  },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' },
  switchBtn: {
    background: 'none', border: 'none', color: 'var(--accent)',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
  },
}
