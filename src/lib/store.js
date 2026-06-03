import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const AVATAR_COLORS = [
  { bg: '#F5E6D3', text: '#9A5E28' },
  { bg: '#E1F0E8', text: '#2D6B4A' },
  { bg: '#E8E3F5', text: '#5A3B8C' },
  { bg: '#F5E3E3', text: '#8C3B3B' },
  { bg: '#E3EEF5', text: '#2B5F7A' },
]

export const useStore = create(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,

      addProfile: (profile) => {
        const id = Date.now().toString()
        const colorIdx = get().profiles.length % AVATAR_COLORS.length
        const newProfile = {
          id,
          ...profile,
          color: AVATAR_COLORS[colorIdx],
          messages: [],
          createdAt: new Date().toISOString(),
        }
        set(s => ({ profiles: [...s.profiles, newProfile], activeProfileId: id }))
        return id
      },

      updateProfile: (id, updates) =>
        set(s => ({
          profiles: s.profiles.map(p => p.id === id ? { ...p, ...updates } : p)
        })),

      deleteProfile: (id) =>
        set(s => ({
          profiles: s.profiles.filter(p => p.id !== id),
          activeProfileId: s.activeProfileId === id
            ? (s.profiles.find(p => p.id !== id)?.id || null)
            : s.activeProfileId
        })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      addMessage: (profileId, message) =>
        set(s => ({
          profiles: s.profiles.map(p =>
            p.id === profileId
              ? { ...p, messages: [...p.messages, { ...message, id: Date.now().toString(), ts: new Date().toISOString() }] }
              : p
          )
        })),

      clearMessages: (profileId) =>
        set(s => ({
          profiles: s.profiles.map(p =>
            p.id === profileId ? { ...p, messages: [] } : p
          )
        })),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find(p => p.id === activeProfileId) || null
      },
    }),
    {
      name: 'persona-chat-store',
      partialize: (s) => ({
        profiles: s.profiles.map(p => ({
          ...p,
          fileContent: p.fileContent?.substring(0, 50000)
        })),
        activeProfileId: s.activeProfileId,
      })
    }
  )
)
