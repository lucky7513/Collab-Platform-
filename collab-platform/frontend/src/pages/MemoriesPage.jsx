import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../utils/api'

export default function MemoriesPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const fileRef = useRef(null)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const res = await api.get('/photos')
      setPhotos(res.data)
    } catch (err) {
      console.error('Failed to fetch photos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async () => {
    if (!preview) return
    setUploading(true)
    try {
      const res = await api.post('/photos', { image_data: preview, caption })
      setPhotos(prev => [res.data, ...prev])
      setPreview(null)
      setCaption('')
      fileRef.current.value = ''
    } catch (err) {
      console.error('Failed to upload:', err)
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (id) => {
    if (!window.confirm('Delete this photo?')) return
    try {
      await api.delete('/photos/' + id)
      setPhotos(prev => prev.filter(p => p.id !== id))
      if (selectedPhoto?.id === id) setSelectedPhoto(null)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Collab</span>
        </div>

        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 4 }}>WORKSPACE</p>
          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/dashboard')}>📄 Documents</div>
          <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)' }}>🖼️ Memories</div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>🖼️ Memories</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{photos.length} photos</p>
          </div>
        </div>

        {/* Upload section */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Upload a Memory</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ color: 'var(--text-primary)', fontSize: 13 }} />
            {preview && (
              <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: 400, borderRadius: 8, objectFit: 'cover' }} />
            )}
            <input
              type="text"
              placeholder="Add a caption... (optional)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none' }}
            />
            <button
              onClick={uploadPhoto}
              disabled={!preview || uploading}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', cursor: preview ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif', opacity: !preview ? 0.5 : 1, alignSelf: 'flex-start' }}
            >
              {uploading ? 'Uploading...' : '📤 Upload Photo'}
            </button>
          </div>
        </div>

        {/* Photo grid */}
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🖼️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No memories yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Upload your first photo above!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedPhoto(photo)}>
                <img src={photo.image_data} alt={photo.caption} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: '12px 14px' }}>
                  {photo.caption && <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{photo.caption}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {photo.owner_name}</span>
                    <button
                      style={{ background: '#e74c3c', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '3px 8px', fontSize: 11, fontFamily: 'Outfit, sans-serif' }}
                      onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id) }}
                    >Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selectedPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedPhoto(null)}>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }}>
            <img src={selectedPhoto.image_data} alt={selectedPhoto.caption} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />
            {selectedPhoto.caption && <p style={{ color: '#fff', marginTop: 12, fontSize: 16 }}>{selectedPhoto.caption}</p>}
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4, fontSize: 13 }}>by {selectedPhoto.owner_name} • Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  )
}