import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import useAuthStore from './store/authStore'

// Restore auth token on page refresh
useAuthStore.getState().initAuth()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)