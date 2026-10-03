// src/app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function ChatHome() {
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/')
      } else {
        setEmail(session.user.email)
        setChecking(false)
      }
    })
  }, [])

  const handleSignOut = async () => {
    console.log('Sign out tapped')
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('signOut timed out')), 5000)),
      ])
      console.log('signOut completed')
    } catch (err) {
      console.log('signOut error/timeout:', err.message)
    }
    console.log('About to call router.replace')
    router.replace('/')
    console.log('router.replace called')
  }

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>You're logged in 🎉</Text>
      <Text style={styles.subtitle}>{email}</Text>
      <Text style={styles.note}>Chat UI goes here next.</Text>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F6FA' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  note: { fontSize: 14, color: '#999', marginBottom: 32 },
  button: { backgroundColor: '#D33', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})