import { createClient } from '@/lib/supabase/server'
import type { Contact } from '@/types'
import { CONTACT_TYPE_LABELS } from '@/types'

type UnitRow = {
  name: string
  stage: string
  rent: number | null
  beds: number | null
  baths: number | null
  size: number | null
}

type ContactRow = {
  first_name: string
  last_name: string
  type: string
}

type OppRow = {
  stage: string
  units: { name: string }[] | null
  contacts: { first_name: string; last_name: string }[] | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, contactContext } = await request.json()

  const [unitsResult, contactsResult, oppsResult] = await Promise.all([
    supabase
      .from('units')
      .select('name, stage, rent, beds, baths, size')
      .order('name', { ascending: true }),

    supabase
      .from('contacts')
      .select('first_name, last_name, type')
      .order('last_name', { ascending: true })
      .limit(200),

    supabase
      .from('leasing_opportunities')
      .select('stage, units(name), contacts(first_name, last_name)')
      .limit(100),
  ])

  const portfolioContext = buildPortfolioContext(
    unitsResult.error ? null : (unitsResult.data as UnitRow[]),
    contactsResult.error ? null : (contactsResult.data as ContactRow[]),
    oppsResult.error ? null : (oppsResult.data as OppRow[])
  )

  const contactSection = contactContext
    ? buildContactContext(contactContext as Contact)
    : 'No specific contact is currently selected.'

  const systemPrompt = `You are an AI assistant embedded in a real estate CRM dashboard. You help real estate agents manage their contacts, understand deal pipelines, and determine next steps.

Current contact context:
${contactSection}
${portfolioContext ? `\nPortfolio data:\n${portfolioContext}` : ''}

Guidelines:
- Be concise and actionable
- Focus on practical next steps and real estate best practices
- When asked about a contact, reference their details from context
- When asked about units, vacancies, rent, or pipeline, use the portfolio data above
- If no contact is selected, answer general real estate CRM questions`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(`OpenRouter error: ${err}`, { status: res.status })
  }

  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content ?? ''
  return new Response(text, { headers: { 'Content-Type': 'text/plain' } })
}

function buildContactContext(contact: Contact): string {
  const lines = [
    `Name: ${contact.first_name} ${contact.last_name}`,
    `Type: ${CONTACT_TYPE_LABELS[contact.type]}`,
    contact.email ? `Email: ${contact.email}` : null,
    contact.phone ? `Phone: ${contact.phone}` : null,
    contact.monthly_income != null ? `Monthly income: ${contact.monthly_income}` : null,
    `Prior evictions disclosed: ${contact.has_evictions ? 'Yes' : 'No'}`,
    contact.drivers_license_human_verified_date
      ? `Driver license human-verified: ${contact.drivers_license_human_verified_date}`
      : 'Driver license human-verified: No',
    `Added: ${contact.created_at}`,
  ].filter(Boolean)

  return lines.join('\n')
}

function buildPortfolioContext(
  units: UnitRow[] | null,
  contacts: ContactRow[] | null,
  opps: OppRow[] | null
): string {
  const sections: string[] = []

  if (units && units.length > 0) {
    const stageCounts = units.reduce<Record<string, number>>((acc, u) => {
      acc[u.stage] = (acc[u.stage] ?? 0) + 1
      return acc
    }, {})
    const stageSummary = Object.entries(stageCounts)
      .map(([s, n]) => `${n} ${s}`)
      .join(', ')

    const rows = units.map((u) => {
      const rent = u.rent != null ? `$${Number(u.rent).toLocaleString()}` : '—'
      const beds = u.beds ?? '—'
      const baths = u.baths ?? '—'
      const size = u.size != null ? `${u.size} sqft` : '—'
      return `  ${u.name} | ${u.stage} | ${rent} | ${beds} bed | ${baths} bath | ${size}`
    })

    sections.push(
      `Units (${units.length} total: ${stageSummary}):\n  Name | Stage | Rent | Beds | Baths | Size\n${rows.join('\n')}`
    )
  }

  if (contacts && contacts.length > 0) {
    const tenants = contacts.filter((c) => c.type === 'tenant')
    const prospects = contacts.filter((c) => c.type === 'prospect')
    const summary = [
      tenants.length > 0 ? `${tenants.length} tenant${tenants.length > 1 ? 's' : ''}` : null,
      prospects.length > 0
        ? `${prospects.length} prospect${prospects.length > 1 ? 's' : ''}`
        : null,
    ]
      .filter(Boolean)
      .join(', ')

    const rows = contacts.map((c) => `  ${c.last_name}, ${c.first_name} (${c.type})`)
    sections.push(`Contacts (${contacts.length} total: ${summary}):\n${rows.join('\n')}`)
  }

  if (opps && opps.length > 0) {
    const rows = opps.map((o) => {
      const contactName = o.contacts?.[0]
        ? `${o.contacts[0].first_name} ${o.contacts[0].last_name}`
        : 'Unknown'
      const unitName = o.units?.[0]?.name ?? 'Unknown unit'
      return `  ${contactName} → ${unitName} [${o.stage}]`
    })
    sections.push(`Leasing pipeline (${opps.length} active opportunities):\n${rows.join('\n')}`)
  }

  return sections.join('\n\n')
}
