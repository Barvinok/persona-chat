// src/app/new-profile.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { router } from 'expo-router'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'

const LANGUAGES = [
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'both', label: 'Ru + Uk' },
  { value: 'en', label: 'English' },
]

const TOPIC_OPTIONS = [
  'Family & children', 'Health', 'Daily life', 'Work & career',
  'Politics & news', 'Memories & nostalgia', 'Advice & wisdom',
  'Emotions & support', 'Humor & jokes', 'Faith & spirituality',
]

const STEPS = ['Basic info', 'Context', 'Topics']

export default function NewProfile() {
  const addProfile = useStore(s => s.addProfile)
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [language, setLanguage] = useState('ru')

  const [inputMode, setInputMode] = useState('upload') // 'upload' | 'paste'
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [pastedText, setPastedText] = useState('')

  const [relationship, setRelationship] = useState('')
  const [extraInfo, setExtraInfo] = useState('')

  const [selectedTopics, setSelectedTopics] = useState([])
  const [customTopic, setCustomTopic] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'application/pdf'],
      copyToCacheDirectory: true,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    try {
      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      })
      setFileContent(content)
      setFileName(asset.name)
      setError(null)
    } catch (e) {
      setError('Could not read that file. Try a plain .txt export instead.')
    }
  }

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim()) { setError('Please enter a name.'); return }
      if (inputMode === 'upload' && !fileContent) { setError('Please upload a communication file.'); return }
      if (inputMode === 'paste' && !pastedText.trim()) { setError('Please paste some text.'); return }
    }
    setError(null)
    setStep(s => s + 1)
  }

  const handleCreate = async () => {
    setError(null)
    setLoading(true)

    const topics = [
      ...selectedTopics,
      ...(customTopic.trim() ? [customTopic.trim()] : [])
    ]

    const effectiveContent = inputMode === 'paste' ? pastedText.trim() : fileContent
    const effectiveFileName = inputMode === 'paste' ? `${name.trim() || 'profile'}_pasted.txt` : fileName

    try {
      let fileUrl = null

      if (effectiveContent && effectiveFileName) {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) throw new Error('Not logged in')

        const filePath = `${user.id}/${Date.now()}_${effectiveFileName}`

        const { error: uploadError } = await supabase.storage
          .from('persona-files')
          .upload(filePath, new Blob([effectiveContent], { type: 'text/plain' }))

        if (uploadError) throw uploadError

        fileUrl = filePath
      }

      await addProfile({
        name: name.trim(),
        language,
        fileContent: effectiveContent,
        fileUrl,
        relationship: relationship.trim(),
        extraInfo: extraInfo.trim(),
        topics,
      })

      router.back()
    } catch (e) {
      setError(e.message || 'Failed to create profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.steps}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, i < step && styles.stepDone, i === step && styles.stepActive]}>
              <Text style={[styles.stepDotText, (i <= step) && styles.stepDotTextActive]}>
                {i < step ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
        {step === 0 && (
          <>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ira, Mama, Alex..."
              value={name}
              onChangeText={t => { setName(t); setError(null) }}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Response language</Text>
            <View style={styles.chipRow}>
              {LANGUAGES.map(l => (
                <Pressable
                  key={l.value}
                  style={[styles.chip, language === l.value && styles.chipActive]}
                  onPress={() => setLanguage(l.value)}
                >
                  <Text style={[styles.chipText, language === l.value && styles.chipTextActive]}>{l.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Communication source</Text>
            <View style={styles.chipRow}>
              <Pressable
                style={[styles.chip, inputMode === 'upload' && styles.chipActive]}
                onPress={() => setInputMode('upload')}
              >
                <Text style={[styles.chipText, inputMode === 'upload' && styles.chipTextActive]}>Upload file</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, inputMode === 'paste' && styles.chipActive]}
                onPress={() => setInputMode('paste')}
              >
                <Text style={[styles.chipText, inputMode === 'paste' && styles.chipTextActive]}>Paste text</Text>
              </Pressable>
            </View>

            {inputMode === 'upload' ? (
              <Pressable style={styles.dropzone} onPress={pickFile}>
                {fileContent ? (
                  <Text style={styles.dropzoneSuccess}>✓ {fileName}</Text>
                ) : (
                  <View>
                    <Text style={styles.dropzonePrompt}>Tap to choose a file</Text>
                    <Text style={styles.dropzoneHint}>TXT, PDF, or WhatsApp export</Text>
                  </View>
                )}
              </Pressable>
            ) : (
              <TextInput
                style={[styles.input, styles.textArea, { minHeight: 160 }]}
                placeholder="Paste messages, chat history, or any text that captures how this person communicates..."
                placeholderTextColor="#999"
                value={pastedText}
                onChangeText={setPastedText}
                multiline
                numberOfLines={8}
              />
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.fieldLabel}>Your relationship to {name || 'this person'}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. My childhood friend, My mother..."
              value={relationship}
              onChangeText={setRelationship}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Extra context (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={`Anything that helps understand ${name || 'them'} better...`}
              value={extraInfo}
              onChangeText={setExtraInfo}
              multiline
              numberOfLines={5}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.description}>
              What topics do you want to talk about with {name}? Select all that apply.
            </Text>

            <View style={styles.chipRow}>
              {TOPIC_OPTIONS.map(topic => (
                <Pressable
                  key={topic}
                  style={[styles.chip, selectedTopics.includes(topic) && styles.chipActive]}
                  onPress={() => toggleTopic(topic)}
                >
                  <Text style={[styles.chipText, selectedTopics.includes(topic) && styles.chipTextActive]}>
                    {topic}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Add your own topic (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Recipes, Travel memories..."
              value={customTopic}
              onChangeText={setCustomTopic}
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <Pressable style={styles.secondaryButton} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        )}

        {step < STEPS.length - 1 ? (
          <Pressable style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>Create profile</Text>
            }
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#F0F0F3',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDone: { backgroundColor: '#208AEF' },
  stepActive: { backgroundColor: '#208AEF' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#999' },
  stepDotTextActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: '#999' },
  stepLabelActive: { color: '#208AEF', fontWeight: '600' },
  body: { flex: 1, paddingHorizontal: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F0F0F3', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#208AEF' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  dropzone: {
    borderWidth: 1.5, borderColor: '#DDD', borderStyle: 'dashed', borderRadius: 12,
    padding: 24, alignItems: 'center', justifyContent: 'center',
  },
  dropzonePrompt: { fontSize: 14, color: '#666', textAlign: 'center', fontWeight: '600' },
  dropzoneHint: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 },
  dropzoneSuccess: { fontSize: 14, color: '#2A2', fontWeight: '600' },
  description: { fontSize: 14, color: '#555', marginBottom: 12 },
  error: { color: '#D33', marginTop: 12 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    padding: 20, borderTopWidth: 1, borderTopColor: '#EEE',
  },
  secondaryButton: { flex: 1, backgroundColor: '#F0F0F3', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '600', color: '#333' },
  primaryButton: { flex: 1, backgroundColor: '#208AEF', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
})