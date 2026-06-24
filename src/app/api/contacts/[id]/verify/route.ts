import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapContactRowFromDb } from '@/lib/domain-mappers'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const verifiedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('contacts')
    .update({ drivers_license_human_verified_date: verifiedAt })
    .eq('id', id)
    .select('*, leasing_opportunities(*, unit:units(*))')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: mapContactRowFromDb(data as Record<string, unknown>) })
}
