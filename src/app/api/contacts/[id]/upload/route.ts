import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pgUuidString } from '@/lib/validations/uuid'
import type { IdUploadType } from '@/types'

// Service-role client — no cookie/SSR wrapper needed for a public endpoint.
function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const ALLOWED_UPLOAD_TYPES: IdUploadType[] = ['front_of_id', 'back_of_id', 'selfie_with_id']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// Maps upload type to the contacts DB column name — hardcoded to prevent injection
const COLUMN_MAP: Record<IdUploadType, 'id_front' | 'id_back' | 'id_selfie'> = {
  front_of_id: 'id_front',
  back_of_id: 'id_back',
  selfie_with_id: 'id_selfie',
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contactId } = await params

    // 1. Validate UUID shape before touching DB
    if (!pgUuidString.safeParse(contactId).success) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const type = formData.get('type') as string | null
    const file = formData.get('file') as File | null

    // 2. Validate upload type
    if (!type || !(ALLOWED_UPLOAD_TYPES as string[]).includes(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    // 3. Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG, or WebP image' },
        { status: 415 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be under 20 MB' }, { status: 413 })
    }

    const supabase = getAdminClient()

    // 4. Verify contact exists — prevents storing files for non-existent contacts
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // 5. Upload file to the appropriate bucket
    const ext = EXT_MAP[file.type] ?? 'jpg'
    const objectPath = `${contactId}/${Date.now()}.${ext}`
    const bucket = type as IdUploadType

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // 6. Update the contact record with the storage path
    const storagePath = `storage/${bucket}/${objectPath}`
    const dbColumn = COLUMN_MAP[type as IdUploadType]

    const { error: dbError } = await supabase
      .from('contacts')
      .update({ [dbColumn]: storagePath, updated_at: new Date().toISOString() })
      .eq('id', contactId)

    if (dbError) {
      return NextResponse.json({ error: 'Failed to save record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: storagePath })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
