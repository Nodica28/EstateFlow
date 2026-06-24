import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapLeasingOpportunityRowFromDb } from '@/lib/domain-mappers'
import { LEASING_PIPELINE_STAGES, LEASING_STAGE_DATE_FIELD } from '@/types'
import { z } from 'zod'

const NESTED_SELECT = `
  *,
  contact:contacts(id, first_name, last_name, email, phone, type),
  unit:units(id, name, rent, stage)
` as const

const stageTransitionSchema = z.object({
  stage: z.enum(LEASING_PIPELINE_STAGES),
})

const dateFieldsSchema = z.object({
  inquired_date: z.string().nullable().optional(),
  qualified_date: z.string().nullable().optional(),
  showing_date: z.string().nullable().optional(),
  toured_date: z.string().nullable().optional(),
  feedback_date: z.string().nullable().optional(),
  applied_date: z.string().nullable().optional(),
  feedback: z.string().nullable().optional(),
})

function computeStageTransitionUpdate(
  targetStage: (typeof LEASING_PIPELINE_STAGES)[number]
): Record<string, string | null> {
  const stageOrder = [...LEASING_PIPELINE_STAGES]
  const targetIdx = stageOrder.indexOf(targetStage)
  const update: Record<string, string | null> = {}

  // Null out all higher-priority stage date fields
  for (let i = targetIdx + 1; i < stageOrder.length; i++) {
    const field = LEASING_STAGE_DATE_FIELD[stageOrder[i]]
    if (field) update[field] = null
  }

  // Set the target stage's date (always overwrite on drag-and-drop)
  const targetField = LEASING_STAGE_DATE_FIELD[targetStage]
  if (targetField) {
    update[targetField] = new Date().toISOString()
  }

  return update
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  let dbUpdate: Record<string, unknown> = {}

  if ('stage' in body) {
    // Drag-and-drop stage transition
    const parsed = stageTransitionSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    dbUpdate = computeStageTransitionUpdate(parsed.data.stage)
  } else {
    // Detail sheet direct date / feedback edits
    const parsed = dateFieldsSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    dbUpdate = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
  }

  const { data, error } = await supabase
    .from('leasing_opportunities')
    .update(dbUpdate)
    .eq('id', id)
    .select(NESTED_SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    data: mapLeasingOpportunityRowFromDb(data as Record<string, unknown>),
  })
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
  const { error } = await supabase.from('leasing_opportunities').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
