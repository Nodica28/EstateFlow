import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapLeasingOpportunityRowFromDb } from '@/lib/domain-mappers'
import { z } from 'zod'
import { pgUuidString } from '@/lib/validations/uuid'

const createSchema = z.object({
  contact_id: pgUuidString,
  unit_id: pgUuidString,
})

const NESTED_SELECT = `
  *,
  contact:contacts(id, first_name, last_name, email, phone, type),
  unit:units(id, name, rent, stage)
` as const

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('leasing_opportunities')
    .select(NESTED_SELECT)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    data: (data ?? []).map((r) => mapLeasingOpportunityRowFromDb(r as Record<string, unknown>)),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('leasing_opportunities')
    .insert({
      contact_id: parsed.data.contact_id,
      unit_id: parsed.data.unit_id,
      inquired_date: new Date().toISOString(),
    })
    .select(NESTED_SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(
    { data: mapLeasingOpportunityRowFromDb(data as Record<string, unknown>) },
    { status: 201 }
  )
}
