import { create } from 'zustand'
import type { Contact, ContactType } from '@/types'

interface ContactFilters {
  search: string
  type: ContactType | 'all'
}

interface ContactStore {
  contacts: Contact[]
  filters: ContactFilters
  isLoading: boolean
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  removeContact: (id: string) => void
  setFilters: (filters: Partial<ContactFilters>) => void
  setLoading: (loading: boolean) => void
  filteredContacts: () => Contact[]
}

export const useContactStore = create<ContactStore>()((set, get) => ({
  contacts: [],
  filters: { search: '', type: 'all' },
  isLoading: false,

  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) => set((s) => ({ contacts: [contact, ...s.contacts] })),
  updateContact: (id, updates) =>
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setLoading: (loading) => set({ isLoading: loading }),

  filteredContacts: () => {
    const { contacts, filters } = get()
    return contacts.filter((c) => {
      const matchesSearch =
        !filters.search ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        String(c.phone ?? '').includes(filters.search)

      const matchesType = filters.type === 'all' || c.type === filters.type

      return matchesSearch && matchesType
    })
  },
}))
