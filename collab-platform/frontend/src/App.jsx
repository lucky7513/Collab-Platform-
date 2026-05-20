import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import DocumentPage from './pages/DocumentPage'
import MemoriesPage from './pages/MemoriesPage'
import './styles/global.css'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
    // Apply saved theme on load
    const savedTheme = localStorage.getItem('collab-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/document/:id" element={<PrivateRoute><DocumentPage /></PrivateRoute>} />
        <Route path="/memories" element={<PrivateRoute><MemoriesPage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}