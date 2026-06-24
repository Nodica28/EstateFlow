import type {
  Contact,
  ContactType,
  ContactUnit,
  LeasingOpportunity,
  LeasingPipelineStage,
  Unit,
  UnitStatus,
} from '@/types'
import { LEASING_PIPELINE_STAGES, UNIT_STATUSES } from '@/types'

/**
 * Returns the highest pipeline stage achieved across all opportunities.
 * LEASING_PIPELINE_STAGES is ordered low→high, so we iterate from the end.
 */
export function derivePipelineStage(opps: { stage?: string }[]): LeasingPipelineStage | null {
  for (let i = LEASING_PIPELINE_STAGES.length - 1; i >= 0; i--) {
    const s = LEASING_PIPELINE_STAGES[i]
    if (opps.some((o) => o.stage === s)) return s
  }
  return null
}

/** Nested contact from units → leasing_opportunities → contacts (units page query). */
export type UnitLeasingContact = {
  id: string
  first_name: string
  last_name: string
  type?: string
}

/**
 * Contacts linked as `type = tenant` for this unit. Ignores prospect pipeline rows
 * so "Current tenants" matches real tenants, not active leads on vacant units.
 */
export function tenantContactsFromLeasingOpportunities(
  opps: { contact?: UnitLeasingContact | null }[] | undefined
): UnitLeasingContact[] {
  const byId = new Map<string, UnitLeasingContact>()
  for (const lo of opps ?? []) {
    const c = lo.contact
    if (c?.id && c.type === 'tenant' && !byId.has(c.id)) {
      byId.set(c.id, c)
    }
  }
  return [...byId.values()]
}

function parseUnitStatus(stage: string): UnitStatus {
  return (UNIT_STATUSES as readonly string[]).includes(stage) ? (stage as UnitStatus) : 'vacant'
}

/** Maps 002_domain_schema unit row to the Unit shape expected by dashboard UI. */
export function mapUnitRowFromDb(row: Record<string, unknown>): Unit {
  const stage = String(row.stage ?? 'vacant')
  return {
    id: String(row.id),
    agent_id: String(row.agent_id),
    address: typeof row.name === 'string' ? row.name : '',
    unit_number: null,
    city: null,
    state: null,
    zip: null,
    bedrooms: row.beds != null ? Number(row.beds) : null,
    bathrooms: row.baths != null ? Number(row.baths) : null,
    rent_amount: row.rent != null ? Number(row.rent) : null,
    size_sf: row.size != null ? Number(row.size) : null,
    ttlock_id: row.ttlock_id != null ? Number(row.ttlock_id) : null,
    tour_checkin_latitude:
      row.tour_checkin_latitude != null ? Number(row.tour_checkin_latitude) : null,
    tour_checkin_longitude:
      row.tour_checkin_longitude != null ? Number(row.tour_checkin_longitude) : null,
    status: parseUnitStatus(stage),
    created_at: String(row.created_at ?? ''),
  }
}

// Maps a leasing_opportunity row to a ContactUnit so the UI can display linked units
function mapLeasingOpportunityToContactUnit(lo: Record<string, unknown>): ContactUnit {
  const unit = lo.unit as Record<string, unknown> | undefined | null
  const stageRaw = String(lo.stage ?? 'inquired')
  const stage: LeasingPipelineStage = (LEASING_PIPELINE_STAGES as readonly string[]).includes(
    stageRaw
  )
    ? (stageRaw as LeasingPipelineStage)
    : 'inquired'
  return {
    id: String(lo.id),
    contact_id: String(lo.contact_id ?? ''),
    unit_id: String(lo.unit_id ?? ''),
    role: 'applicant',
    created_at: String(lo.created_at ?? ''),
    stage,
    unit: unit && typeof unit === 'object' ? mapUnitRowFromDb(unit) : undefined,
  }
}

/** Maps 002_domain_schema contact row + nested leasing_opportunities to the Contact type. */
export function mapContactRowFromDb(row: Record<string, unknown>): Contact {
  const rawType = String(row.type ?? 'prospect')
  const type: ContactType = rawType === 'tenant' ? 'tenant' : 'prospect'

  const phoneVal = row.phone
  const phone = phoneVal == null ? null : typeof phoneVal === 'string' ? phoneVal : String(phoneVal)

  const opps: Record<string, unknown>[] = Array.isArray(row.leasing_opportunities)
    ? (row.leasing_opportunities as Record<string, unknown>[])
    : []

  return {
    id: String(row.id),
    agent_id: String(row.agent_id),
    first_name: String(row.first_name ?? ''),
    last_name: String(row.last_name ?? ''),
    email: row.email != null ? String(row.email) : null,
    phone,
    type,
    drivers_license_human_verified_date:
      row.drivers_license_human_verified_date != null
        ? String(row.drivers_license_human_verified_date)
        : null,
    id_front: row.id_front != null ? String(row.id_front) : null,
    id_back: row.id_back != null ? String(row.id_back) : null,
    id_selfie: row.id_selfie != null ? String(row.id_selfie) : null,
    qualified_date: row.qualified_date != null ? String(row.qualified_date) : null,
    monthly_income: row.monthly_income != null ? Number(row.monthly_income) : null,
    has_evictions: Boolean(row.has_evictions),
    preferred_move_in_date:
      row.preferred_move_in_date != null ? String(row.preferred_move_in_date) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? row.created_at ?? ''),
    pipeline_stage: derivePipelineStage(opps as { stage?: string }[]),
    units: opps.map((lo) => mapLeasingOpportunityToContactUnit(lo)),
  }
}

/**
 * Maps a raw leasing_opportunities DB row (with nested contact and unit) to LeasingOpportunity.
 * Note: units.name maps to address in the UI (the DB column is called `name`).
 */
export function mapLeasingOpportunityRowFromDb(row: Record<string, unknown>): LeasingOpportunity {
  const stageRaw = String(row.stage ?? 'inquired')
  const stage: LeasingPipelineStage = (LEASING_PIPELINE_STAGES as readonly string[]).includes(
    stageRaw
  )
    ? (stageRaw as LeasingPipelineStage)
    : 'inquired'

  const contact = row.contact as Record<string, unknown> | undefined | null
  const unit = row.unit as Record<string, unknown> | undefined | null

  return {
    id: String(row.id),
    contact_id: String(row.contact_id),
    unit_id: String(row.unit_id),
    stage,
    inquired_date: row.inquired_date != null ? String(row.inquired_date) : null,
    qualified_date: row.qualified_date != null ? String(row.qualified_date) : null,
    showing_date: row.showing_date != null ? String(row.showing_date) : null,
    toured_date: row.toured_date != null ? String(row.toured_date) : null,
    feedback_date: row.feedback_date != null ? String(row.feedback_date) : null,
    applied_date: row.applied_date != null ? String(row.applied_date) : null,
    feedback: row.feedback != null ? String(row.feedback) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    contact: contact
      ? {
          id: String(contact.id),
          first_name: String(contact.first_name ?? ''),
          last_name: String(contact.last_name ?? ''),
          email: contact.email != null ? String(contact.email) : null,
          phone: contact.phone != null ? String(contact.phone) : null,
          type: String(contact.type ?? 'prospect'),
        }
      : undefined,
    unit: unit
      ? {
          id: String(unit.id),
          // DB column is `name`; when joined as unit:units(*) the key is `name`
          address: typeof unit.name === 'string' ? unit.name : String(unit.address ?? ''),
          unit_number: null,
          city: null,
          state: null,
          rent_amount: unit.rent != null ? Number(unit.rent) : null,
        }
      : undefined,
  }
}
