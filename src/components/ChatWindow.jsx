import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../lib/store'
import { sendChatMessage } from '../lib/api'
import Avatar from './Avatar'
import './ChatWindow.css'

const LANG_LABELS = { ru: 'Russian', uk: 'Ukrainian', both: 'RU + UK', en: 'English' }

export default function ChatWindow() {
  const { profiles, activeProfileId, addMessage, clearMessages, updateProfile } = useStore()
  const profile = profiles.find(p => p.id === activeProfileId)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [profile?.messages, isTyping])

  useEffect(() => {
    setInput('')
    setError(null)
  }, [activeProfileId])

  if (!profile) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-inner">
          <div className="chat-empty-icon">💬</div>
          <h2>Select a profile</h2>
          <p>Choose a profile from the sidebar or create a new one to start chatting.</p>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    setError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    addMessage(profile.id, { role: 'user', content: text })
    setIsTyping(true)

    try {
      const updatedProfile = useStore.getState().profiles.find(p => p.id === profile.id)
      const allMessages = [
        ...updatedProfile.messages.filter(m => m.role === 'user' || m.role === 'assistant'),
      ]
      const reply = await sendChatMessage(updatedProfile, allMessages)
      addMessage(profile.id, { role: 'assistant', content: reply })
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API key in Vercel settings.')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <Avatar name={profile.name} color={profile.color} size={36} />
        <div className="chat-header-info">
          <span className="chat-header-name">{profile.name}</span>
          <span className="chat-header-meta">{LANG_LABELS[profile.language]}</span>
        </div>
        <div className="chat-header-actions">
          <select
            className="lang-select"
            value={profile.language}
            onChange={e => updateProfile(profile.id, { language: e.target.value })}
            title="Response language"
          >
            <option value="ru">Russian</option>
            <option value="uk">Ukrainian</option>
            <option value="both">RU + UK</option>
            <option value="en">English</option>
          </select>
          <button
            className="clear-btn"
            onClick={() => confirm('Clear all messages?') && clearMessages(profile.id)}
            title="Clear chat"
          >Clear</button>
        </div>
      </div>

      <div className="messages-container">
        {profile.messages.length === 0 && (
          <div className="messages-empty">
            <p>Start a conversation with <strong>{profile.name}</strong></p>
          </div>
        )}

        {profile.messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <Avatar name={profile.name} color={profile.color} size={28} />
            )}
            <div className="message-bubble">
              {msg.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-row assistant">
            <Avatar name={profile.name} color={profile.color} size={28} />
            <div className="message-bubble typing-bubble">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error">
            <span>⚠ {error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder={`Message ${profile.name}...`}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          aria-label="Send"
        >↑</button>
      </div>
    </div>
  )
}
