import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL + '/api'
  : 'https://collab-platform-62rd.onrender.com/api'

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('collab-auth')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {}
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('collab-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.detail || error.response?.data?.message || error.message)
  }
)

export default api