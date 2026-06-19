import React, { useState } from 'react'
import { useStore } from '../lib/store'
import Avatar from './Avatar'
import NewProfileModal from './NewProfileModal'
import './Sidebar.css'

const LANG_SHORT = { ru: 'RU', uk: 'UK', both: 'RU+UK', en: 'EN' }

export default function Sidebar({ user, onSignOut }) {
  const { profiles, activeProfileId, setActiveProfile, deleteProfile } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Persona<span>Chat</span></h1>
        </div>

        <div className="profile-list">
          {profiles.length === 0 && (
            <div className="empty-profiles">
              <p>No profiles yet.</p>
              <p>Create your first one below.</p>
            </div>
          )}
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`profile-item ${profile.id === activeProfileId ? 'active' : ''}`}
              onClick={() => { setActiveProfile(profile.id); setMenuOpenId(null) }}
            >
              <Avatar name={profile.name} color={profile.color} size={38} />
              <div className="profile-item-info">
                <span className="profile-item-name">{profile.name}</span>
                <span className="profile-item-meta">{LANG_SHORT[profile.language] || profile.language} · {profile.messages.length} msgs</span>
              </div>
              <div className="profile-item-actions">
                <button
                  className="menu-btn"
                  onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === profile.id ? null : profile.id) }}
                  aria-label="Options"
                >⋯</button>
                {menuOpenId === profile.id && (
                  <div className="profile-menu">
                    <button onClick={e => { e.stopPropagation(); if (confirm(`Delete ${profile.name}?`)) { deleteProfile(profile.id); setMenuOpenId(null) } }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="add-profile-btn" onClick={() => setShowModal(true)}>
          <span>+</span> New profile
        </button>

        <div className="sidebar-footer">
          <span className="sidebar-email">{user?.email}</span>
          <button className="signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </aside>

      {showModal && <NewProfileModal onClose={() => setShowModal(false)} />}
    </>
  )
}
