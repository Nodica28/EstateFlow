'use client'

import { useEffect } from 'react'
import { useContactStore } from '@/stores/useContactStore'
import type { Contact } from '@/types'
import { ContactTable } from './ContactTable'
import { ContactFiltersBar } from './ContactFiltersBar'
import { createClient } from '@/lib/supabase/client'

export function ContactsView({ initialContacts }: { initialContacts: Contact[] }) {
  const { setContacts, addContact, updateContact } = useContactStore()

  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts, setContacts])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('contacts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, (payload) =>
        addContact(payload.new as Contact)
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contacts' }, (payload) =>
        updateContact(payload.new.id, payload.new as Partial<Contact>)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addContact, updateContact])

  return (
    <div className="flex h-full flex-col">
      <ContactFiltersBar />
      <div className="flex-1 overflow-auto">
        <ContactTable />
      </div>
    </div>
  )
}
