import React, { useEffect } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'

const LANG_SHORT = { ru: 'RU', uk: 'UK', both: 'RU+UK', en: 'EN' }

export default function Home() {
  const { profiles, loading, loadProfiles } = useStore()

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleSignOut = async () => {
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ])
    } catch (e) {
      // ignore — local session clears regardless via auth listener
    }
    router.replace('/')
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Persona<Text style={styles.titleAccent}>Chat</Text></Text>
        <Pressable onPress={handleSignOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      <FlatList
        data={profiles}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No profiles yet</Text>
            <Text style={styles.emptyText}>Create your first one to start chatting.</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/new-profile')}>
              <Text style={styles.emptyButtonText}>+ New profile</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: profile }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/chat/${profile.id}`)}
          >
            <View style={[styles.avatar, { backgroundColor: profile.color?.bg || '#eee' }]}>
              <Text style={[styles.avatarText, { color: profile.color?.text || '#333' }]}>
                {profile.name?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{profile.name}</Text>
              <Text style={styles.rowMeta}>
                {LANG_SHORT[profile.language] || profile.language} · {profile.messages?.length ?? 0} msgs
              </Text>
            </View>
          </Pressable>
        )}
      />

      {profiles.length > 0 && (
        <Pressable style={styles.fab} onPress={() => router.push('/new-profile')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700' },
  titleAccent: { color: '#208AEF' },
  signOut: { color: '#D33', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  emptyButton: { backgroundColor: '#208AEF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700', fontSize: 17 },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: '600', fontSize: 16 },
  rowMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#208AEF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '700', lineHeight: 30 },
})