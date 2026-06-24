import { TopBar } from '@/components/layout/TopBar'
import { UnitsView } from '@/components/units/UnitsView'
import { mapUnitRowFromDb } from '@/lib/domain-mappers'
import { createClient } from '@/lib/supabase/server'
import type { ComponentProps } from 'react'

type UnitWithContacts = ComponentProps<typeof UnitsView>['initialUnits'][number]

export default async function UnitsPage() {
  const supabase = await createClient()

  const { data: units } = await supabase
    .from('units')
    .select('*, leasing_opportunities(*, contact:contacts(id, first_name, last_name, type))')
    .order('created_at', { ascending: false })

  const initialUnits: UnitWithContacts[] = (units ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    return {
      ...mapUnitRowFromDb(r),
      leasing_opportunities: r.leasing_opportunities as UnitWithContacts['leasing_opportunities'],
    }
  })

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Units" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <UnitsView initialUnits={initialUnits} />
      </div>
    </div>
  )
}
