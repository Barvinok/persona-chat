import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useStore } from '../lib/store'
import './NewProfileModal.css'

const LANGUAGES = [
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'both', label: 'Russian + Ukrainian' },
  { value: 'en', label: 'English' },
]

export default function NewProfileModal({ onClose }) {
  const addProfile = useStore(s => s.addProfile)
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('ru')
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onDrop = useCallback((accepted) => {
    const file = accepted[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setFileContent(e.target.result)
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return }
    if (!fileContent) { setError('Please upload a communication file.'); return }
    setLoading(true)
    addProfile({ name: name.trim(), language, fileContent, fileName })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>New profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="field-label">Name</label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Ira, Mama, Alex..."
              value={name}
              onChange={e => { setName(e.target.value); setError(null) }}
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label">Response language</label>
            <select
              className="field-input"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Communication file</label>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'drag-active' : ''} ${fileContent ? 'has-file' : ''}`}>
              <input {...getInputProps()} />
              {fileContent ? (
                <div className="dropzone-success">
                  <span className="dropzone-icon">✓</span>
                  <span>{fileName}</span>
                </div>
              ) : (
                <div className="dropzone-prompt">
                  <span className="dropzone-icon">↑</span>
                  <span>{isDragActive ? 'Drop it here' : 'Upload TXT, PDF, or WhatsApp export'}</span>
                  <span className="dropzone-hint">Drag & drop or click to browse</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
