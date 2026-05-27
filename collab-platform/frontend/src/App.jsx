import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import DocumentPage from './pages/DocumentPage'
import MemoriesPage from './pages/MemoriesPage'
<<<<<<< HEAD
import AIFeaturePanel from './components/AIFeaturePanel'
=======
import ProfilePage from './pages/ProfilePage'
>>>>>>> 7ccae6caacc5206c5f0659b0ca2e40fd9eedfb2d
import './styles/global.css'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function DashboardWithAI() {
  return (
    <>
      <Dashboard />
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        width: 420,
      }}>
        <AIFeaturePanel />
      </div>
    </>
  )
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
        <Route path="/dashboard" element={<PrivateRoute><DashboardWithAI /></PrivateRoute>} />
        <Route path="/document/:id" element={<PrivateRoute><DocumentPage /></PrivateRoute>} />
        <Route path="/memories" element={<PrivateRoute><MemoriesPage /></PrivateRoute>} />
<Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}