import { Suspense } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { LicenseReviewView } from '@/components/licenses/LicenseReviewView'
import { mapContactRowFromDb } from '@/lib/domain-mappers'
import { createClient } from '@/lib/supabase/server'

export default async function LicenseReviewPage() {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('contacts')
    .select('*, leasing_opportunities(*, unit:units(*))')
    .or('id_front.not.is.null,id_back.not.is.null,id_selfie.not.is.null')
    .is('drivers_license_human_verified_date', null)
    .order('created_at', { ascending: false })

  const initialContacts = (rows ?? []).map((row) =>
    mapContactRowFromDb(row as Record<string, unknown>)
  )

  return (
    <div className="flex h-full flex-col">
      <TopBar title="License review" />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Loading…
            </div>
          }
        >
          <LicenseReviewView initialContacts={initialContacts} />
        </Suspense>
      </div>
    </div>
  )
}
