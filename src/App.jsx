import React from 'react'
import { useAuth } from './hooks/useAuth'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import './App.css'

export default function App() {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} onSignOut={signOut} />
      <ChatWindow />
    </div>
  )
}
