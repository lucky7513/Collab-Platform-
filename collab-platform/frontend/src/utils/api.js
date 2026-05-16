import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL + '/api'
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 10000,
})

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