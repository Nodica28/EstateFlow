import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { derivePipelineStage } from '@/lib/domain-mappers'
import type { ContactType, LeasingPipelineStage } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: contacts }, { data: communications }, { data: profile }, { data: authData }] =
    await Promise.all([
      supabase
        .from('contacts')
        .select(
          'id, first_name, last_name, type, created_at, leasing_opportunities(stage, unit:units(name))'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('communications')
        .select(
          'id, type, direction, subject, body, created_at, contact:contacts(first_name, last_name)'
        )
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('profiles').select('full_name').single(),
      supabase.auth.getUser(),
    ])

  const allContacts = contacts ?? []
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const stageCounts: Record<LeasingPipelineStage, number> = {
    inquired: 0,
    qualified: 0,
    showing: 0,
    toured: 0,
    feedback: 0,
    applied: 0,
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const contactsWithStage = allContacts.map((c: any) => {
    const stage = derivePipelineStage(c.leasing_opportunities ?? [])
    if (stage) stageCounts[stage] += 1
    return { ...c, bestStage: stage }
  })

  const stats = {
    total: contactsWithStage.length,
    newThisWeek: contactsWithStage.filter((c) => new Date(c.created_at) >= weekAgo).length,
    stageCounts,
  }

  const recentContacts = contactsWithStage.slice(0, 6).map((c: any) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    type: (c.type === 'tenant' ? 'tenant' : 'prospect') as ContactType,
    created_at: c.created_at,
    contact_units: (c.leasing_opportunities ?? []).map((lo: any) => {
      const u = Array.isArray(lo.unit) ? (lo.unit[0] ?? null) : (lo.unit ?? null)
      return { unit: u ? { address: u.name ?? '', unit_number: null } : null }
    }),
  }))
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentCommunications = (communications ?? []).map((comm: any) => ({
    ...comm,
    contact: Array.isArray(comm.contact) ? (comm.contact[0] ?? null) : (comm.contact ?? null),
  }))

  return (
    <DashboardShell
      userName={profile?.full_name ?? authData?.user?.email ?? 'Agent'}
      stats={stats}
      recentContacts={recentContacts}
      recentCommunications={recentCommunications}
    />
  )
}
