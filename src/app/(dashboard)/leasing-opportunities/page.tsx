import { TopBar } from '@/components/layout/TopBar'
import { LeasingView } from '@/components/leasing-opportunities/LeasingView'
import { mapLeasingOpportunityRowFromDb } from '@/lib/domain-mappers'
import { createClient } from '@/lib/supabase/server'

export default async function LeasingOpportunitiesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('leasing_opportunities')
    .select(
      `
      *,
      contact:contacts(id, first_name, last_name, email, phone, type),
      unit:units(id, name, rent, stage)
    `
    )
    .order('created_at', { ascending: false })

  const initialOpportunities = (data ?? []).map((raw) =>
    mapLeasingOpportunityRowFromDb(raw as Record<string, unknown>)
  )

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Leasing" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <LeasingView initialOpportunities={initialOpportunities} />
      </div>
    </div>
  )
}
