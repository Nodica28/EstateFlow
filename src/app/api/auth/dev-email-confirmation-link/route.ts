import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * Development only: generates a Supabase email confirmation or sign-in link and prints it
 * to the Next.js dev server terminal (for test accounts with no real inbox).
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const redirectTo =
    process.env.NEXT_PUBLIC_APP_URL != null && process.env.NEXT_PUBLIC_APP_URL !== ''
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/dashboard`
      : undefined

  const supabase = await createServiceClient()

  const signup = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    ...(redirectTo ? { options: { redirectTo } } : {}),
  })

  let actionLink = signup.data?.properties?.action_link ?? null
  let verificationType = signup.data?.properties?.verification_type ?? 'signup'

  if (signup.error || !actionLink) {
    const magic = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      ...(redirectTo ? { options: { redirectTo } } : {}),
    })
    if (magic.error || !magic.data?.properties?.action_link) {
      console.error('[dev] Could not generate confirmation link:', signup.error ?? magic.error)
      return NextResponse.json({ error: 'Could not generate link' }, { status: 500 })
    }
    actionLink = magic.data.properties.action_link
    verificationType = magic.data.properties.verification_type ?? 'magiclink'
  }

  console.info('\n[dev] ─── Supabase auth link ─────────────────────────────────────')
  console.info(`[dev] Email: ${email}`)
  console.info(`[dev] Type:  ${verificationType}`)
  console.info(`[dev] ${actionLink}`)
  console.info('[dev] ─────────────────────────────────────────────────────────────\n')

  return NextResponse.json({ ok: true })
}
