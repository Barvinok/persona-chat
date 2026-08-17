import React, { useState } from 'react'
import { useStore } from '../lib/store'
import Avatar from './Avatar'
import './ManageProfilesModal.css'

const LANGUAGES = [
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'both', label: 'Russian + Ukrainian' },
  { value: 'en', label: 'English' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ManageProfilesModal({ onClose }) {
  const { profiles, updateProfile, deleteProfile, deleteProfiles } = useStore()

  const [selected, setSelected] = useState(new Set())
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  const toggleSelected = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  const startEdit = (profile) => {
    setEditingId(profile.id)
    setEditForm({
      name: profile.name || '',
      language: profile.language || 'ru',
      relationship: profile.relationship || '',
      extra_info: profile.extra_info || '',
      topics: (profile.topics || []).join(', '),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const saveEdit = async (id) => {
    setBusy(true)
    await updateProfile(id, {
      name: editForm.name.trim(),
      language: editForm.language,
      relationship: editForm.relationship.trim(),
      extra_info: editForm.extra_info.trim(),
      topics: editForm.topics.split(',').map(t => t.trim()).filter(Boolean),
    })
    setBusy(false)
    cancelEdit()
  }

  const handleDeleteOne = async (id, name) => {
    if (!confirm(`Delete ${name}? This also removes their chat history and uploaded file.`)) return
    setBusy(true)
    await deleteProfile(id)
    setSelected(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setBusy(false)
  }

  const handleDeleteSelected = async () => {
    const count = selected.size
    if (!count) return
    if (!confirm(`Delete ${count} profile${count > 1 ? 's' : ''}? This also removes their chat history and uploaded files.`)) return
    setBusy(true)
    await deleteProfiles([...selected])
    setSelected(new Set())
    setBusy(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card manage-card">
        <div className="modal-header">
          <h2>Manage profiles</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="manage-toolbar">
          <input
            className="manage-search"
            type="text"
            placeholder="Search profiles..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            className="btn-danger"
            onClick={handleDeleteSelected}
            disabled={selected.size === 0 || busy}
          >
            Delete selected {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>

        <div className="manage-body">
          {filtered.length === 0 && (
            <div className="manage-empty">No profiles match.</div>
          )}

          {filtered.length > 0 && (
            <div className="manage-list-header">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
              />
              <span>Select all</span>
            </div>
          )}

          {filtered.map(profile => (
            <div key={profile.id} className="manage-row">
              <div className="manage-row-main">
                <input
                  type="checkbox"
                  checked={selected.has(profile.id)}
                  onChange={() => toggleSelected(profile.id)}
                />
                <Avatar name={profile.name} color={profile.color} size={34} />
                <div className="manage-row-info">
                  <span className="manage-row-name">{profile.name}</span>
                  <span className="manage-row-meta">
                    {LANGUAGES.find(l => l.value === profile.language)?.label || profile.language}
                    {' · '}{profile.messages.length} msgs
                    {' · created '}{formatDate(profile.created_at)}
                  </span>
                </div>
                <div className="manage-row-actions">
                  <button
                    className="btn-secondary btn-small"
                    onClick={() => editingId === profile.id ? cancelEdit() : startEdit(profile)}
                  >
                    {editingId === profile.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    className="btn-danger btn-small"
                    onClick={() => handleDeleteOne(profile.id, profile.name)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === profile.id && editForm && (
                <div className="manage-row-edit">
                  <div className="field">
                    <label className="field-label">Name</label>
                    <input
                      className="field-input"
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Response language</label>
                    <select
                      className="field-input"
                      value={editForm.language}
                      onChange={e => setEditForm(f => ({ ...f, language: e.target.value }))}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Relationship</label>
                    <input
                      className="field-input"
                      type="text"
                      value={editForm.relationship}
                      onChange={e => setEditForm(f => ({ ...f, relationship: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Extra context</label>
                    <textarea
                      className="field-input field-textarea"
                      rows={3}
                      value={editForm.extra_info}
                      onChange={e => setEditForm(f => ({ ...f, extra_info: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Topics (comma-separated)</label>
                    <input
                      className="field-input"
                      type="text"
                      value={editForm.topics}
                      onChange={e => setEditForm(f => ({ ...f, topics: e.target.value }))}
                    />
                  </div>
                  <div className="manage-edit-actions">
                    <button className="btn-secondary btn-small" onClick={cancelEdit}>Cancel</button>
                    <button
                      className="btn-primary btn-small"
                      onClick={() => saveEdit(profile.id)}
                      disabled={busy || !editForm.name.trim()}
                    >
                      {busy ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
