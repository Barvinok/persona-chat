import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useStore } from '../../lib/store'
import { sendChatMessage, extractFacts } from '../../lib/api'

const LANGUAGES = [
  { value: 'ru', label: 'RU' },
  { value: 'uk', label: 'UK' },
  { value: 'both', label: 'RU+UK' },
  { value: 'en', label: 'EN' },
]

export default function Chat() {
  const { id } = useLocalSearchParams()
  const navigation = useNavigation()
  const { profiles, addMessage, clearMessages, updateProfile, addFacts } = useStore()
  const profile = profiles.find(p => p.id === id)

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (profile) {
      navigation.setOptions({ title: profile.name })
    }
  }, [profile?.name])

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text>Profile not found.</Text>
      </View>
    )
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    setError(null)

    addMessage(profile.id, { role: 'user', content: text })
    setIsTyping(true)

    try {
      const updatedProfile = useStore.getState().profiles.find(p => p.id === profile.id)
      const allMessages = updatedProfile.messages.filter(m => m.role === 'user' || m.role === 'assistant')
      const reply = await sendChatMessage(updatedProfile, allMessages)
      await addMessage(profile.id, { role: 'assistant', content: reply })

      const latestProfile = useStore.getState().profiles.find(p => p.id === profile.id)
      extractFacts(latestProfile, text, reply).then(newFacts => {
        if (newFacts.length) addFacts(profile.id, newFacts)
      })
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setIsTyping(false)
    }
  }

  const handleClear = () => {
    Alert.alert('Clear all messages?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearMessages(profile.id) },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.langRow}>
          {LANGUAGES.map(l => (
            <Pressable
              key={l.value}
              style={[styles.langChip, profile.language === l.value && styles.langChipActive]}
              onPress={() => updateProfile(profile.id, { language: l.value })}
            >
              <Text style={[styles.langChipText, profile.language === l.value && styles.langChipTextActive]}>
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={profile.messages}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>Start a conversation with {profile.name}</Text>
          </View>
        }
        renderItem={({ item: msg }) => (
          <View style={[styles.messageRow, msg.role === 'user' && styles.messageRowUser]}>
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
                {msg.content}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.messageRow}>
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <ActivityIndicator size="small" />
              </View>
            </View>
          ) : null
        }
      />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${profile.name}...`}
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || isTyping) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isTyping}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#fff',
  },
  langRow: { flexDirection: 'row', gap: 6 },
  langChip: { backgroundColor: '#F0F0F3', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  langChipActive: { backgroundColor: '#208AEF' },
  langChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  langChipTextActive: { color: '#fff' },
  clearText: { color: '#D33', fontWeight: '600', fontSize: 13 },
  emptyMessages: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyMessagesText: { color: '#999', fontSize: 14 },
  messageRow: { marginBottom: 10, alignItems: 'flex-start' },
  messageRowUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAssistant: { backgroundColor: '#fff', borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#208AEF', borderTopRightRadius: 4 },
  bubbleTextAssistant: { color: '#222', fontSize: 15, lineHeight: 20 },
  bubbleTextUser: { color: '#fff', fontSize: 15, lineHeight: 20 },
  errorBanner: { backgroundColor: '#FDEAEA', paddingHorizontal: 16, paddingVertical: 8 },
  errorText: { color: '#D33', fontSize: 13 },
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#fff',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#208AEF',
    justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
})
