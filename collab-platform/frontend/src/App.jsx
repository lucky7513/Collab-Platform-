import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import DocumentPage from './pages/DocumentPage'
import MemoriesPage from './pages/MemoriesPage'
import AIFeaturePanel from './components/AIFeaturePanel'
import './styles/global.css'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function DashboardWithAI() {
  return (
    <>
      <Dashboard />
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, width: 420 }}>
        <AIFeaturePanel />
      </div>
    </>
  )
}

export default function App() {
  const { initAuth } = useAuthStore()
  useEffect(() => {
    initAuth()
  }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardWithAI /></PrivateRoute>} />
        <Route path="/document/:id" element={<PrivateRoute><DocumentPage /></PrivateRoute>} />
        <Route path="/memories" element={<PrivateRoute><MemoriesPage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}