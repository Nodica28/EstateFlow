import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const unitStageSchema = z.enum(['occupied', 'notice', 'vacant', 'terminated'])

const updateUnitSchema = z.object({
  address: z.string().min(1).optional(),
  bedrooms: z.number().int().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  rent_amount: z.number().optional().nullable(),
  size_sf: z.number().int().min(0).optional().nullable(),
  ttlock_id: z.number().int().optional().nullable(),
  tour_checkin_latitude: z.number().gte(-90).lte(90).optional().nullable(),
  tour_checkin_longitude: z.number().gte(-180).lte(180).optional().nullable(),
  status: unitStageSchema.optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = updateUnitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const {
    address,
    bedrooms,
    bathrooms,
    rent_amount,
    size_sf,
    ttlock_id,
    tour_checkin_latitude,
    tour_checkin_longitude,
    status,
  } = parsed.data

  // Map UI schema → DB schema
  const dbUpdate: Record<string, unknown> = {}
  if (address !== undefined) dbUpdate.name = address
  if (bedrooms !== undefined) dbUpdate.beds = bedrooms
  if (bathrooms !== undefined) dbUpdate.baths = bathrooms
  if (rent_amount !== undefined) dbUpdate.rent = rent_amount
  if (size_sf !== undefined) dbUpdate.size = size_sf
  if (ttlock_id !== undefined) dbUpdate.ttlock_id = ttlock_id
  if (tour_checkin_latitude !== undefined) dbUpdate.tour_checkin_latitude = tour_checkin_latitude
  if (tour_checkin_longitude !== undefined) dbUpdate.tour_checkin_longitude = tour_checkin_longitude
  if (status !== undefined) dbUpdate.stage = status

  const { data, error } = await supabase
    .from('units')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
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
  const { error } = await supabase.from('units').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
