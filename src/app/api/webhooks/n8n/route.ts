import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { n8nContactPayloadSchema } from '@/lib/validations/webhook'

function createServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function verifySignature(request: NextRequest, body: string): Promise<boolean> {
  const signature = request.headers.get('x-webhook-signature')
  if (!signature) return false

  const secret = process.env.WEBHOOK_SECRET
  if (!secret) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = `sha256=${Buffer.from(sig).toString('hex')}`

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const isValid = await verifySignature(request, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = n8nContactPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { first_name, last_name, email, phone, type, unit_address, agent_id } = parsed.data

  const supabase = createServiceClient()

  let existingId: string | null = null
  if (email) {
    const { data } = await supabase.from('contacts').select('id').eq('email', email).maybeSingle()
    existingId = data?.id ?? null
  }

  const contactData = {
    first_name,
    last_name,
    email: email ?? null,
    phone: phone ? phone.replace(/\D/g, '') || null : null,
    type,
    ...(agent_id ? { agent_id } : {}),
    updated_at: new Date().toISOString(),
  }

  let contactId: string
  if (existingId) {
    await supabase.from('contacts').update(contactData).eq('id', existingId)
    contactId = existingId
  } else {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }
    contactId = data.id
  }

  if (unit_address) {
    let { data: unit } = await supabase
      .from('units')
      .select('id')
      .eq('name', unit_address)
      .maybeSingle()

    if (!unit) {
      const insertRow: { name: string; agent_id?: string } = { name: unit_address }
      if (agent_id) insertRow.agent_id = agent_id
      const { data: newUnit } = await supabase.from('units').insert(insertRow).select('id').single()
      unit = newUnit
    }

    if (unit) {
      await supabase
        .from('contact_units')
        .upsert(
          { contact_id: contactId, unit_id: unit.id, role: 'applicant' },
          { onConflict: 'contact_id,unit_id' }
        )
    }
  }

  return NextResponse.json({ success: true, contact_id: contactId })
}
