import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { pgUuidString } from '@/lib/validations/uuid'
import { IdUploadAlreadyComplete } from './IdUploadAlreadyComplete'
import { IdUploadClient } from './IdUploadClient'

export default async function UploadPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params

  if (!pgUuidString.safeParse(contactId).success) notFound()

  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('first_name, last_name, id_front, id_back, id_selfie')
    .eq('id', contactId)
    .single()

  if (error || !data) notFound()

  const contactName = `${data.first_name} ${data.last_name}`.trim()
  const allDocumentsUploaded = Boolean(data.id_front && data.id_back && data.id_selfie)

  if (allDocumentsUploaded) {
    return <IdUploadAlreadyComplete contactName={contactName || 'there'} />
  }

  return <IdUploadClient contactId={contactId} contactName={contactName || 'there'} />
}
