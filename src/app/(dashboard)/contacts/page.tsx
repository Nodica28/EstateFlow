import { TopBar } from '@/components/layout/TopBar'
import { ContactsView } from '@/components/contacts/ContactsView'
import { mapContactRowFromDb } from '@/lib/domain-mappers'
import { createClient } from '@/lib/supabase/server'

export default async function ContactsPage() {
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, leasing_opportunities(*, unit:units(*))')
    .order('created_at', { ascending: false })

  const initialContacts = (contacts ?? []).map((row) =>
    mapContactRowFromDb(row as Record<string, unknown>)
  )

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Contacts" />
      <div className="flex-1 overflow-hidden">
        <ContactsView initialContacts={initialContacts} />
      </div>
    </div>
  )
}
