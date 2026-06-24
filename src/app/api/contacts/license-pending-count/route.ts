import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count, error } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .or('id_front.not.is.null,id_back.not.is.null,id_selfie.not.is.null')
    .is('drivers_license_human_verified_date', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const n = count ?? 0
  return NextResponse.json({
    /** License image on file and not human-verified (license review queue). */
    count: n,
    readyToVerify: n,
  })
}
