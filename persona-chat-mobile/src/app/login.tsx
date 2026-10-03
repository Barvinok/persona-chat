import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Check your email to confirm, then log in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.replace('/(tabs)/home')
      }
    }

    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.logo}>Persona<Text style={styles.logoAccent}>Chat</Text></Text>
        <Text style={styles.tagline}>Chat with AI profiles that speak in the voice of people you know.</Text>

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => { setMode('login'); setError(null); setSuccess(null) }}>
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Log in</Text>
          </Pressable>
          <Pressable style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => { setMode('signup'); setError(null); setSuccess(null) }}>
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign up</Text>
          </Pressable>
        </View>

        <View style={styles.fields}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999"
            value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" autoFocus />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999"
            value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {success && <Text style={styles.success}>{success}</Text>}

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F5F6FA' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  logo: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  logoAccent: { color: '#208AEF' },
  tagline: { textAlign: 'center', color: '#666', marginBottom: 24 },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, backgroundColor: '#F0F0F3', padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#111' },
  fields: { gap: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  error: { color: '#D33', marginTop: 8 },
  success: { color: '#2A2', marginTop: 8 },
  button: { backgroundColor: '#208AEF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
