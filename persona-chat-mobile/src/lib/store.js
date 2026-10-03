import { create } from 'zustand'
import { supabase } from './supabase'

export const useStore = create((set, get) => ({
  profiles: [],
  activeProfileId: null,
  loading: false,

  loadProfiles: async () => {
    set({ loading: true })
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Failed to load profiles:', error.message)
      set({ loading: false })
      return
    }
    const profilesWithData = await Promise.all(
      profiles.map(async (p) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('profile_id', p.id)
          .order('created_at', { ascending: true })
        const { data: facts } = await supabase
          .from('profile_facts')
          .select('*')
          .eq('profile_id', p.id)
          .order('created_at', { ascending: true })
        return {
          ...p,
          color: colorForIndex(profiles.indexOf(p)),
          topics: p.topics ? p.topics.split(',') : [],
          messages: (messages || []).map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
          facts: (facts || []).map(f => ({
            id: f.id,
            person_name: f.person_name,
            fact: f.fact,
          })),
        }
      })
    )
    set({ profiles: profilesWithData, loading: false })
  },

  addProfile: async (profile) => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        name: profile.name,
        language: profile.language,
        relationship: profile.relationship || null,
        extra_info: profile.extraInfo || null,
        topics: profile.topics?.join(',') || null,
        file_url: profile.fileUrl || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create profile:', error.message)
      return null
    }

    const newProfile = {
      ...data,
      color: colorForIndex(get().profiles.length),
      topics: profile.topics || [],
      fileContent: profile.fileContent || null,
      messages: [],
    }

    set(s => ({ profiles: [...s.profiles, newProfile], activeProfileId: data.id }))
    return data.id
  },

  updateProfile: async (id, updates) => {
    set(s => ({
      profiles: s.profiles.map(p => p.id === id ? { ...p, ...updates } : p)
    }))

    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.language !== undefined) dbUpdates.language = updates.language
    if (updates.relationship !== undefined) dbUpdates.relationship = updates.relationship
    if (updates.extra_info !== undefined) dbUpdates.extra_info = updates.extra_info
    if (updates.topics !== undefined) {
      dbUpdates.topics = Array.isArray(updates.topics)
        ? updates.topics.join(',')
        : updates.topics
    }

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id)
      if (error) console.error('Failed to update profile:', error.message)
    }
  },

  deleteProfile: async (id) => {
    const profile = get().profiles.find(p => p.id === id)

    if (profile?.file_url) {
      const { error: storageError } = await supabase.storage
        .from('persona-files')
        .remove([profile.file_url])
      if (storageError) {
        console.error('Failed to remove profile file from storage:', storageError.message)
      }
    }

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete profile:', error.message)
      return
    }

    set(s => ({
      profiles: s.profiles.filter(p => p.id !== id),
      activeProfileId: s.activeProfileId === id
        ? (s.profiles.find(p => p.id !== id)?.id || null)
        : s.activeProfileId
    }))
  },

  deleteProfiles: async (ids) => {
    for (const id of ids) {
      await get().deleteProfile(id)
    }
  },

  setActiveProfile: (id) => set({ activeProfileId: id }),

  addMessage: async (profileId, message) => {
    const tempId = Date.now().toString()
    set(s => ({
      profiles: s.profiles.map(p =>
        p.id === profileId
          ? { ...p, messages: [...p.messages, { ...message, id: tempId }] }
          : p
      )
    }))

    const { data, error } = await supabase
      .from('messages')
      .insert({ profile_id: profileId, role: message.role, content: message.content })
      .select()
      .single()

    if (error) {
      console.error('Failed to save message:', error.message)
      return
    }

    set(s => ({
      profiles: s.profiles.map(p =>
        p.id === profileId
          ? { ...p, messages: p.messages.map(m => m.id === tempId ? { ...m, id: data.id } : m) }
          : p
      )
    }))
  },

  addFacts: (profileId, newFacts) => {
    set(s => ({
      profiles: s.profiles.map(p =>
        p.id === profileId
          ? { ...p, facts: [...(p.facts || []), ...newFacts.map(f => ({ id: f.id, person_name: f.person_name, fact: f.fact }))] }
          : p
      )
    }))
  },

  clearMessages: async (profileId) => {
    await supabase.from('messages').delete().eq('profile_id', profileId)
    set(s => ({
      profiles: s.profiles.map(p => p.id === profileId ? { ...p, messages: [] } : p)
    }))
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get()
    return profiles.find(p => p.id === activeProfileId) || null
  },
}))

const AVATAR_COLORS = [
  { bg: '#F5E6D3', text: '#9A5E28' },
  { bg: '#E1F0E8', text: '#2D6B4A' },
  { bg: '#E8E3F5', text: '#5A3B8C' },
  { bg: '#F5E3E3', text: '#8C3B3B' },
  { bg: '#E3EEF5', text: '#2B5F7A' },
]

function colorForIndex(i) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length]
}
