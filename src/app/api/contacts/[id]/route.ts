import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapContactRowFromDb } from '@/lib/domain-mappers'

const ALLOWED_COLUMNS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'drivers_license_human_verified_date',
  'qualified_date',
  'monthly_income',
  'has_evictions',
  'preferred_move_in_date',
  'id_front',
  'id_back',
  'id_selfie',
] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const dbBody: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const col of ALLOWED_COLUMNS) {
    if (col in body) {
      if (col === 'phone' && typeof body.phone === 'string') {
        const digits = body.phone.replace(/\D/g, '')
        dbBody[col] = digits || null
      } else {
        dbBody[col] = body[col]
      }
    }
  }
  if ('type' in body) {
    dbBody.type = body.type === 'tenant' ? 'tenant' : 'prospect'
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(dbBody)
    .eq('id', id)
    .select('*, leasing_opportunities(*, unit:units(*))')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: mapContactRowFromDb(data as Record<string, unknown>) })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('contacts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
