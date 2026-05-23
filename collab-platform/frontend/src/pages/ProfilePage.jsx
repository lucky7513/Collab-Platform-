import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../utils/api'

const AVATAR_COLORS = [
  '#7c6aff', '#2ecc71', '#e74c3c', '#f39c12', '#3498db',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63', '#00bcd4',
  '#ff5722', '#607d8b'
]

export default function ProfilePage() {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [avatarColor, setAvatarColor] = useState('#7c6aff')
  const [avatarImage, setAvatarImage] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [passError, setPassError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
      setName(res.data.name)
      setAvatarColor(res.data.avatar_color || '#7c6aff')
      setAvatarImage(res.data.avatar_image || null)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

 const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setNameError('Image must be less than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      // Compress image using canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 200
        let w = img.width, h = img.height
        if (w > h) { h = (h / w) * maxSize; w = maxSize }
        else { w = (w / h) * maxSize; h = maxSize }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        setAvatarImage(compressed)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }
  const removeImage = () => {
    setAvatarImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveProfile = async () => {
    setSaving(true)
    setNameError('')
    setNameSuccess('')
    try {
      await api.patch('/users/me', {
        name,
        avatar_color: avatarColor,
        avatar_image: avatarImage,
      })
console.log('Save response:', res.data)
      setNameSuccess('Profile updated successfully!')
      setProfile(prev => ({ ...prev, name, avatar_color: avatarColor, avatar_image: avatarImage }))
      setTimeout(() => setNameSuccess(''), 3000)
    } catch (err) {
      setNameError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setPassError('')
    setPassSuccess('')
    if (newPassword !== confirmPassword) { setPassError('New passwords do not match.'); return }
    if (newPassword.length < 4) { setPassError('Password must be at least 4 characters.'); return }
    setSaving(true)
    try {
      await api.post('/users/me/change-password', { current_password: currentPassword, new_password: newPassword })
      setPassSuccess('Password changed successfully!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPassSuccess(''), 3000)
    } catch (err) {
      setPassError(err || 'Current password is incorrect.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone!')) return
    if (!window.confirm('All your documents will be permanently deleted. Are you absolutely sure?')) return
    try {
      await api.delete('/users/me')
      useAuthStore.getState().logout()
      navigate('/login')
    } catch (err) {
      alert('Failed to delete account.')
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'Outfit, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .profile-input:focus { outline: none; border-color: #7c6aff !important; box-shadow: 0 0 0 3px rgba(124,106,255,0.15) !important; }
        .color-swatch:hover { transform: scale(1.15) !important; }
        .tab-btn:hover { background: var(--bg-hover) !important; }
        .save-btn:hover { opacity: 0.9 !important; transform: translateY(-1px); }
        .upload-btn:hover { border-color: #7c6aff !important; background: rgba(124,106,255,0.05) !important; }
      `}</style>

      {/* Header */}
      <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>My Profile</span>
      </header>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px', animation: 'fadeIn 0.3s ease' }}>

        {/* Profile Card */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarImage ? (
              <img src={avatarImage} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 4px 16px rgba(0,0,0,0.3)` }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', boxShadow: `0 4px 16px ${avatarColor}60` }}>
                {getInitials(profile?.name)}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>{profile?.name}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>{profile?.email}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Member since {formatDate(profile?.created_at)}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', marginBottom: 2 }}>{profile?.stats?.owned_documents || 0}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>MY DOCS</p>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#2ecc71', marginBottom: 2 }}>{profile?.stats?.shared_documents || 0}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>SHARED</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid var(--border)' }}>
          {[
            { id: 'profile', label: '👤 Profile' },
            { id: 'password', label: '🔒 Password' },
            { id: 'danger', label: '⚠️ Danger Zone' },
          ].map(tab => (
            <button key={tab.id} className="tab-btn" style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s', background: activeTab === tab.id ? 'var(--accent)' : 'none', color: activeTab === tab.id ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Avatar Upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>Profile Picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Preview */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {avatarImage ? (
                    <img src={avatarImage} alt="avatar preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', border: '3px solid var(--border)' }}>
                      {getInitials(name)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  <button className="upload-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s' }}
                    onClick={() => fileInputRef.current?.click()}>
                    📷 Upload Photo
                  </button>
                  {avatarImage && (
                    <button style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '8px 16px', color: '#e74c3c', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Outfit, sans-serif' }}
                      onClick={removeImage}>
                      🗑️ Remove Photo
                    </button>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG or GIF · Max 2MB</p>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Display Name</label>
              <input className="profile-input" style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', boxSizing: 'border-box' }}
                value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Email Address</label>
              <input style={{ width: '100%', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box', cursor: 'not-allowed' }}
                value={profile?.email} disabled />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed</p>
            </div>

            {/* Avatar Color */}
            {!avatarImage && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>Avatar Color <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(used when no photo)</span></label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map(color => (
                    <div key={color} className="color-swatch" style={{ width: 36, height: 36, borderRadius: '50%', background: color, cursor: 'pointer', transition: 'transform 0.15s', border: avatarColor === color ? '3px solid white' : '3px solid transparent', boxShadow: avatarColor === color ? `0 0 0 2px ${color}` : 'none' }}
                      onClick={() => setAvatarColor(color)} />
                  ))}
                </div>
              </div>
            )}

            {nameSuccess && <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 8, padding: '10px 14px', color: '#2ecc71', fontSize: 13 }}>✅ {nameSuccess}</div>}
            {nameError && <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', color: '#e74c3c', fontSize: 13 }}>⚠️ {nameError}</div>}

            <button className="save-btn" style={{ background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}
              onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Current Password</label>
              <input className="profile-input" style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', boxSizing: 'border-box' }}
                type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>New Password</label>
              <input className="profile-input" style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', boxSizing: 'border-box' }}
                type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Confirm New Password</label>
              <input className="profile-input" style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', boxSizing: 'border-box' }}
                type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            {passSuccess && <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 8, padding: '10px 14px', color: '#2ecc71', fontSize: 13 }}>✅ {passSuccess}</div>}
            {passError && <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', color: '#e74c3c', fontSize: 13 }}>⚠️ {passError}</div>}

            <button className="save-btn" style={{ background: 'linear-gradient(135deg, #7c6aff, #5b4de8)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}
              onClick={changePassword} disabled={saving}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e74c3c', marginBottom: 8 }}>⚠️ Delete Account</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Once you delete your account, all your documents and data will be permanently removed. This action cannot be undone.
            </p>
            <button style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, padding: '12px 24px', color: '#e74c3c', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
              onClick={deleteAccount}>
              Delete My Account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}