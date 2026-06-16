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

const STEPS = ['Basic info', 'Context', 'Topics']

export default function NewProfileModal({ onClose }) {
  const addProfile = useStore(s => s.addProfile)
  const [step, setStep] = useState(0)

  // Step 0
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('ru')
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState(null)

  // Step 1 — extra info
  const [relationship, setRelationship] = useState('')
  const [extraInfo, setExtraInfo] = useState('')

  // Step 2 — conversation topics
  const TOPIC_OPTIONS = [
    'Family & children', 'Health', 'Daily life', 'Work & career',
    'Politics & news', 'Memories & nostalgia', 'Advice & wisdom',
    'Emotions & support', 'Humor & jokes', 'Faith & spirituality',
  ]
  const [selectedTopics, setSelectedTopics] = useState([])
  const [customTopic, setCustomTopic] = useState('')

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

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim()) { setError('Please enter a name.'); return }
      if (!fileContent) { setError('Please upload a communication file.'); return }
    }
    setError(null)
    setStep(s => s + 1)
  }

  const handleCreate = () => {
    const topics = [
      ...selectedTopics,
      ...(customTopic.trim() ? [customTopic.trim()] : [])
    ]
    addProfile({
      name: name.trim(),
      language,
      fileContent,
      fileName,
      relationship: relationship.trim(),
      extraInfo: extraInfo.trim(),
      topics,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>New profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`step-label ${i === step ? 'active' : ''}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="modal-body">

          {/* STEP 0: Basic info */}
          {step === 0 && (
            <>
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
                <select className="field-input" value={language} onChange={e => setLanguage(e.target.value)}>
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
            </>
          )}

          {/* STEP 1: Context */}
          {step === 1 && (
            <>
              <div className="field">
                <label className="field-label">Your relationship to {name || 'this person'}</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. My childhood friend, My mother, My colleague..."
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="field">
                <label className="field-label">Extra context <span className="field-optional">(optional)</span></label>
                <textarea
                  className="field-input field-textarea"
                  placeholder={`Anything that helps understand ${name || 'them'} better — their personality, life situation, things they care about, how they typically talk to you...`}
                  value={extraInfo}
                  onChange={e => setExtraInfo(e.target.value)}
                  rows={5}
                />
              </div>
            </>
          )}

          {/* STEP 2: Topics */}
          {step === 2 && (
            <>
              <p className="step-description">
                What topics do you want to talk about with <strong>{name}</strong>? Select all that apply.
              </p>

              <div className="topics-grid">
                {TOPIC_OPTIONS.map(topic => (
                  <button
                    key={topic}
                    className={`topic-chip ${selectedTopics.includes(topic) ? 'selected' : ''}`}
                    onClick={() => toggleTopic(topic)}
                    type="button"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="field">
                <label className="field-label">Add your own topic <span className="field-optional">(optional)</span></label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. Recipes, Travel memories..."
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          {step > 0
            ? <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>
            : <button className="btn-secondary" onClick={onClose}>Cancel</button>
          }
          {step < STEPS.length - 1
            ? <button className="btn-primary" onClick={handleNext}>Continue</button>
            : <button className="btn-primary" onClick={handleCreate}>Create profile</button>
          }
        </div>
      </div>
    </div>
  )
}
