import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { haversineMeters } from '@/lib/geo/haversineMeters'
import { pgUuidString } from '@/lib/validations/uuid'

const MAX_DISTANCE_METERS = 100

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const bodySchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  accuracyMeters: z.number().positive().optional().nullable(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: leasingOpportunityId } = await params

    if (!pgUuidString.safeParse(leasingOpportunityId).success) {
      return NextResponse.json({ error: 'Invalid leasing opportunity' }, { status: 400 })
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid check-in payload' }, { status: 422 })
    }

    const { latitude, longitude, accuracyMeters } = parsed.data
    const supabase = getAdminClient()

    const { data: row, error: fetchError } = await supabase
      .from('leasing_opportunities')
      .select('id, unit:units ( tour_checkin_latitude, tour_checkin_longitude )')
      .eq('id', leasingOpportunityId)
      .single()

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Leasing opportunity not found' }, { status: 404 })
    }

    const rawUnit = row.unit as unknown
    const unit = (Array.isArray(rawUnit) ? rawUnit[0] : rawUnit) as {
      tour_checkin_latitude: number | null
      tour_checkin_longitude: number | null
    } | null
    const pinLat = unit?.tour_checkin_latitude
    const pinLng = unit?.tour_checkin_longitude

    if (pinLat == null || pinLng == null) {
      return NextResponse.json(
        { error: "Check-in isn't available for this property yet." },
        { status: 409 }
      )
    }

    const distance = haversineMeters(latitude, longitude, pinLat, pinLng)
    if (distance > MAX_DISTANCE_METERS) {
      return NextResponse.json(
        { error: "You don't appear to be at the property yet. Move closer and try again." },
        { status: 422 }
      )
    }

    const { error: insertError } = await supabase.from('tour_checkins').insert({
      leasing_opportunity_id: leasingOpportunityId,
      latitude,
      longitude,
      accuracy_meters: accuracyMeters ?? null,
    })

    if (insertError) {
      console.error(insertError)
      return NextResponse.json({ error: 'Could not record check-in' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
