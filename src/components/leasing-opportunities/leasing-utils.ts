import { LEASING_PIPELINE_STAGES, LEASING_STAGE_DATE_FIELD } from '@/types'
import type { LeasingOpportunity, LeasingPipelineStage } from '@/types'

/** Color classes for each stage badge. */
export const STAGE_COLORS: Record<LeasingPipelineStage, string> = {
  inquired: 'bg-slate-100 text-slate-700',
  qualified: 'bg-purple-100 text-purple-700',
  showing: 'bg-blue-100 text-blue-700',
  toured: 'bg-cyan-100 text-cyan-700',
  feedback: 'bg-amber-100 text-amber-800',
  applied: 'bg-green-100 text-green-700',
}

/**
 * Computes an optimistic local state update when dragging a card to a new stage.
 * Mirrors the server-side logic in PATCH /api/leasing-opportunities/[id].
 */
export function computeOptimisticStageUpdate(
  opp: LeasingOpportunity,
  targetStage: LeasingPipelineStage
): LeasingOpportunity {
  const stageOrder = [...LEASING_PIPELINE_STAGES]
  const targetIdx = stageOrder.indexOf(targetStage)
  const now = new Date().toISOString()

  // Build a plain object of date field overrides, then spread into the opp
  const dates: {
    inquired_date?: string | null
    qualified_date?: string | null
    showing_date?: string | null
    toured_date?: string | null
    feedback_date?: string | null
    applied_date?: string | null
  } = {}

  // Set the target stage's date
  const targetField = LEASING_STAGE_DATE_FIELD[targetStage]
  if (targetField === 'qualified_date') dates.qualified_date = now
  else if (targetField === 'showing_date') dates.showing_date = now
  else if (targetField === 'toured_date') dates.toured_date = now
  else if (targetField === 'feedback_date') dates.feedback_date = now
  else if (targetField === 'applied_date') dates.applied_date = now

  // Null out higher-priority date fields
  for (let i = targetIdx + 1; i < stageOrder.length; i++) {
    const field = LEASING_STAGE_DATE_FIELD[stageOrder[i]]
    if (field === 'qualified_date') dates.qualified_date = null
    else if (field === 'showing_date') dates.showing_date = null
    else if (field === 'toured_date') dates.toured_date = null
    else if (field === 'feedback_date') dates.feedback_date = null
    else if (field === 'applied_date') dates.applied_date = null
  }

  return { ...opp, ...dates, stage: targetStage }
}

/** Returns the date value for a stage's corresponding date field, given an opportunity. */
export function getStageDate(opp: LeasingOpportunity, stage: LeasingPipelineStage): string | null {
  if (stage === 'inquired') return opp.inquired_date
  if (stage === 'qualified') return opp.qualified_date
  if (stage === 'showing') return opp.showing_date
  if (stage === 'toured') return opp.toured_date
  if (stage === 'feedback') return opp.feedback_date
  if (stage === 'applied') return opp.applied_date
  return null
}
