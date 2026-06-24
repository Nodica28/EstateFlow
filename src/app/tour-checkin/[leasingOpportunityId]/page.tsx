import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { pgUuidString } from '@/lib/validations/uuid'
import { TourCheckinClient } from '@/app/tour-checkin/[leasingOpportunityId]/TourCheckinClient'

export default async function TourCheckinPage({
  params,
}: {
  params: Promise<{ leasingOpportunityId: string }>
}) {
  const { leasingOpportunityId } = await params

  if (!pgUuidString.safeParse(leasingOpportunityId).success) notFound()

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('leasing_opportunities')
    .select(
      'id, contact:contacts ( first_name, last_name ), unit:units ( tour_checkin_latitude, tour_checkin_longitude )'
    )
    .eq('id', leasingOpportunityId)
    .single()

  if (error || !data) notFound()

  const rawContact = data.contact as unknown
  const contact = (Array.isArray(rawContact) ? rawContact[0] : rawContact) as {
    first_name: string
    last_name: string
  } | null

  const rawUnit = data.unit as unknown
  const unit = (Array.isArray(rawUnit) ? rawUnit[0] : rawUnit) as {
    tour_checkin_latitude: number | null
    tour_checkin_longitude: number | null
  } | null

  const contactName = `${contact?.first_name ?? ''} ${contact?.last_name ?? ''}`.trim()
  const unitCheckInConfigured =
    unit != null && unit.tour_checkin_latitude != null && unit.tour_checkin_longitude != null

  return (
    <TourCheckinClient
      leasingOpportunityId={leasingOpportunityId}
      contactName={contactName || 'there'}
      unitCheckInConfigured={unitCheckInConfigured}
    />
  )
}
