import React from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import './App.css'

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <ChatWindow />
    </div>
  )
}
