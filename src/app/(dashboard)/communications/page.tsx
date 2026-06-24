import { TopBar } from '@/components/layout/TopBar'
import { AllCommunicationsView } from '@/components/communications/AllCommunicationsView'
import type { CommWithMeta } from '@/stores/useCommunicationsStore'
import { createClient } from '@/lib/supabase/server'

export default async function CommunicationsPage() {
  const supabase = await createClient()

  const { data: communications } = await supabase
    .from('communications')
    .select('*, contact:contacts(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  // Normalise: ensure boolean fields exist (migration 005 adds them; default false if absent)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalised: CommWithMeta[] = (communications ?? []).map((c: any) => ({
    ...c,
    contact: Array.isArray(c.contact) ? (c.contact[0] ?? null) : (c.contact ?? null),
    is_read: c.is_read ?? false,
    is_archived: c.is_archived ?? false,
    is_favorite: c.is_favorite ?? false,
  }))

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Communications" />
      <div className="flex-1 overflow-hidden">
        <AllCommunicationsView initialCommunications={normalised} />
      </div>
    </div>
  )
}
