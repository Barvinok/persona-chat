// src/app/(tabs)/explore.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useStore } from '../../lib/store'

const LANGUAGES = [
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'both', label: 'Ru + Uk' },
  { value: 'en', label: 'English' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Explore() {
  const { profiles, loading, loadProfiles, updateProfile, deleteProfile, deleteProfiles } = useStore()

  const [selected, setSelected] = useState(new Set())
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [])

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
    if (!editForm) return
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

  const handleDeleteOne = (id, name) => {
    Alert.alert(
      `Delete ${name}?`,
      'This also removes their chat history and uploaded file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setBusy(true)
            await deleteProfile(id)
            setSelected(prev => {
              const next = new Set(prev)
              next.delete(id)
              return next
            })
            setBusy(false)
          }
        },
      ]
    )
  }

  const handleDeleteSelected = () => {
    const count = selected.size
    if (!count) return
    Alert.alert(
      `Delete ${count} profile${count > 1 ? 's' : ''}?`,
      'This also removes their chat history and uploaded files.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setBusy(true)
            await deleteProfiles([...selected])
            setSelected(new Set())
            setBusy(false)
          }
        },
      ]
    )
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>
  }

  return (
    <View style={styles.page}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          placeholder="Search profiles..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
        />
        <Pressable style={styles.addButton} onPress={() => router.push('/new-profile')}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
        <Pressable
          style={[styles.dangerButton, selected.size === 0 && styles.buttonDisabled]}
          onPress={handleDeleteSelected}
          disabled={selected.size === 0 || busy}
        >
          <Text style={styles.dangerButtonText}>
            Delete {selected.size > 0 ? `(${selected.size})` : ''}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No profiles match.</Text>}
        renderItem={({ item: profile }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Pressable onPress={() => toggleSelected(profile.id)} style={styles.checkbox}>
                <View style={[styles.checkboxBox, selected.has(profile.id) && styles.checkboxChecked]} />
              </Pressable>
              <View style={[styles.avatar, { backgroundColor: profile.color?.bg || '#eee' }]}>
                <Text style={[styles.avatarText, { color: profile.color?.text || '#333' }]}>
                  {profile.name?.[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{profile.name}</Text>
                <Text style={styles.rowMeta}>
                  {LANGUAGES.find(l => l.value === profile.language)?.label || profile.language}
                  {' · '}{profile.messages?.length ?? 0} msgs
                  {' · '}{formatDate(profile.created_at)}
                </Text>
              </View>
              <Pressable
                style={styles.smallButton}
                onPress={() => editingId === profile.id ? cancelEdit() : startEdit(profile)}
              >
                <Text style={styles.smallButtonText}>{editingId === profile.id ? 'Cancel' : 'Edit'}</Text>
              </Pressable>
              <Pressable
                style={styles.smallDangerButton}
                onPress={() => handleDeleteOne(profile.id, profile.name)}
                disabled={busy}
              >
                <Text style={styles.smallDangerButtonText}>Delete</Text>
              </Pressable>
            </View>

            {editingId === profile.id && editForm && (
              <View style={styles.editPanel}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editForm.name}
                  onChangeText={t => setEditForm(f => f ? { ...f, name: t } : f)}
                />

                <Text style={styles.fieldLabel}>Response language</Text>
                <View style={styles.chipRow}>
                  {LANGUAGES.map(l => (
                    <Pressable
                      key={l.value}
                      style={[styles.chip, editForm.language === l.value && styles.chipActive]}
                      onPress={() => setEditForm(f => f ? { ...f, language: l.value } : f)}
                    >
                      <Text style={[styles.chipText, editForm.language === l.value && styles.chipTextActive]}>
                        {l.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Relationship</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editForm.relationship}
                  onChangeText={t => setEditForm(f => f ? { ...f, relationship: t } : f)}
                />

                <Text style={styles.fieldLabel}>Extra context</Text>
                <TextInput
                  style={[styles.fieldInput, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  value={editForm.extra_info}
                  onChangeText={t => setEditForm(f => f ? { ...f, extra_info: t } : f)}
                />

                <Text style={styles.fieldLabel}>Topics (comma-separated)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editForm.topics}
                  onChangeText={t => setEditForm(f => f ? { ...f, topics: t } : f)}
                />

                <View style={styles.editActions}>
                  <Pressable style={styles.smallButton} onPress={cancelEdit}>
                    <Text style={styles.smallButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryButton, (busy || !editForm.name.trim()) && styles.buttonDisabled]}
                    onPress={() => saveEdit(profile.id)}
                    disabled={busy || !editForm.name.trim()}
                  >
                    <Text style={styles.primaryButtonText}>{busy ? 'Saving...' : 'Save'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { flex: 1, backgroundColor: '#F5F6FA', padding: 16 },
  toolbar: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  search: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
  },
  addButton: {
    backgroundColor: '#208AEF', borderRadius: 10, width: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  dangerButton: { backgroundColor: '#D33', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  dangerButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { padding: 4 },
  checkboxBox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#CCC', borderRadius: 5 },
  checkboxChecked: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  avatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700', fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: '600', fontSize: 15 },
  rowMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  smallButton: { backgroundColor: '#F0F0F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallButtonText: { fontSize: 12, fontWeight: '600', color: '#333' },
  smallDangerButton: { backgroundColor: '#FDEAEA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallDangerButtonText: { fontSize: 12, fontWeight: '600', color: '#D33' },
  editPanel: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEE', gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginTop: 8, marginBottom: 4 },
  fieldInput: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  textArea: { textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#F0F0F3', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: '#208AEF' },
  chipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  primaryButton: { backgroundColor: '#208AEF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
})