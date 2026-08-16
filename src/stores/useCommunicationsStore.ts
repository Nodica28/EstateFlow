import { create } from 'zustand'
import type { Communication } from '@/types'

export interface CommWithMeta extends Communication {
  contact?: { first_name: string; last_name: string } | null
  is_read: boolean
  is_archived: boolean
  is_favorite: boolean
}

interface CommunicationsStore {
  communications: CommWithMeta[]
  setCommunications: (items: CommWithMeta[]) => void
  markRead: (id: string) => void
  markUnread: (id: string) => void
  toggleFavorite: (id: string) => void
  toggleArchive: (id: string) => void
  remove: (id: string) => void
  unreadCount: () => number
}

async function patchComm(
  id: string,
  updates: Partial<Pick<CommWithMeta, 'is_read' | 'is_archived' | 'is_favorite'>>
) {
  await fetch(`/api/communications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
}

async function deleteComm(id: string) {
  await fetch(`/api/communications/${id}`, { method: 'DELETE' })
}

export const useCommunicationsStore = create<CommunicationsStore>()((set, get) => ({
  communications: [],

  setCommunications: (items) => set({ communications: items }),

  markRead: (id) => {
    set((s) => ({
      communications: s.communications.map((c) => (c.id === id ? { ...c, is_read: true } : c)),
    }))
    patchComm(id, { is_read: true })
  },

  markUnread: (id) => {
    set((s) => ({
      communications: s.communications.map((c) => (c.id === id ? { ...c, is_read: false } : c)),
    }))
    patchComm(id, { is_read: false })
  },

  toggleFavorite: (id) => {
    const comm = get().communications.find((c) => c.id === id)
    if (!comm) return
    const next = !comm.is_favorite
    set((s) => ({
      communications: s.communications.map((c) => (c.id === id ? { ...c, is_favorite: next } : c)),
    }))
    patchComm(id, { is_favorite: next })
  },

  toggleArchive: (id) => {
    const comm = get().communications.find((c) => c.id === id)
    if (!comm) return
    const next = !comm.is_archived
    set((s) => ({
      communications: s.communications.map((c) => (c.id === id ? { ...c, is_archived: next } : c)),
    }))
    patchComm(id, { is_archived: next })
  },

  remove: (id) => {
    set((s) => ({
      communications: s.communications.filter((c) => c.id !== id),
    }))
    deleteComm(id)
  },

  unreadCount: () => get().communications.filter((c) => !c.is_read && !c.is_archived).length,
}))
