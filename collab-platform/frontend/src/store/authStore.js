import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token, name, avatarColor } = res.data
        set({ token, user: { name, email, avatarColor }, isAuthenticated: true })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
      register: async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password })
        const { token, avatarColor } = res.data
        set({ token, user: { name, email, avatarColor }, isAuthenticated: true })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        delete api.defaults.headers.common['Authorization']
      },
      initAuth: async () => {
        const { token } = get()
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          try {
            const res = await api.get('/users/me')
            set(state => ({
              user: {
                ...state.user,
                name: res.data.name,
                avatarColor: res.data.avatar_color,
                avatar_image: res.data.avatar_image || null,
              }
            }))
          } catch (err) {
            console.error('Failed to refresh user profile:', err)
          }
        }
      },
      updateUser: (updates) => {
        set(state => ({ user: { ...state.user, ...updates } }))
      }
    }),
    {
      name: 'collab-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
)

export default useAuthStore