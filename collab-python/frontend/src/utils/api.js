import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('collab-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.message || error.message)
  }
)

export default api
