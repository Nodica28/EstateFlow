import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const unitStageSchema = z.enum(['occupied', 'notice', 'vacant', 'terminated'])

const createUnitSchema = z.object({
  address: z.string().min(1),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  rent_amount: z.number().optional(),
  size_sf: z.number().int().min(0).optional(),
  ttlock_id: z.number().int().optional().nullable(),
  status: unitStageSchema.default('vacant'),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createUnitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { address, bedrooms, bathrooms, rent_amount, size_sf, ttlock_id, status } = parsed.data
  const dbRow = {
    name: address,
    beds: bedrooms ?? null,
    baths: bathrooms ?? null,
    rent: rent_amount ?? null,
    size: size_sf ?? null,
    ttlock_id: ttlock_id ?? null,
    stage: status,
    agent_id: user.id,
  }

  const { data, error } = await supabase.from('units').insert(dbRow).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
