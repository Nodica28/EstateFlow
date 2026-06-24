import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapContactRowFromDb } from '@/lib/domain-mappers'
import { z } from 'zod'

const createContactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(['prospect', 'tenant']).default('prospect'),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const type = searchParams.get('type')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = (page - 1) * limit

  let query = supabase
    .from('contacts')
    .select('*, leasing_opportunities(*, unit:units(*))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.ilike('first_name', `%${search}%`)
  if (type && type !== 'all') query = query.eq('type', type)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createContactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, ...rest } = parsed.data
  const dbRow = {
    first_name: rest.first_name,
    last_name: rest.last_name,
    email: rest.email || null,
    phone: rest.phone ? rest.phone.replace(/\D/g, '') || null : null,
    type,
    agent_id: user.id,
  }

  const { data, error } = await supabase.from('contacts').insert(dbRow).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    data: mapContactRowFromDb({ ...(data as Record<string, unknown>), leasing_opportunities: [] }),
  })
}
