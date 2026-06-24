export type ContactType = 'prospect' | 'tenant'
export type IdUploadType = 'front_of_id' | 'back_of_id' | 'selfie_with_id'

/**
 * Pipeline stage for a leasing_opportunity record.
 * Ordered low → high priority (matches kanban column order left → right).
 * The DB stage column is GENERATED from date fields; highest-priority non-null date wins.
 */
export const LEASING_PIPELINE_STAGES = [
  'inquired',
  'qualified',
  'showing',
  'toured',
  'feedback',
  'applied',
] as const

export type LeasingPipelineStage = (typeof LEASING_PIPELINE_STAGES)[number]

export type CommunicationType = 'email' | 'sms' | 'phone'
export type CommunicationDirection = 'inbound' | 'outbound'
/** Matches `units.stage` in Supabase (002_domain_schema). */
export type UnitStatus = 'occupied' | 'notice' | 'vacant' | 'terminated'

/** Column order for units board (kanban). */
export const UNIT_STATUSES: UnitStatus[] = ['occupied', 'notice', 'vacant', 'terminated']

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export interface Contact {
  id: string
  agent_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  type: ContactType
  drivers_license_human_verified_date: string | null
  id_front: string | null
  id_back: string | null
  id_selfie: string | null
  qualified_date: string | null
  monthly_income: number | null
  has_evictions: boolean
  preferred_move_in_date: string | null
  created_at: string
  updated_at: string
  /** Set when leasing_opportunities are joined; for dashboard analytics only. */
  pipeline_stage?: LeasingPipelineStage | null
  units?: ContactUnit[]
}

export interface Unit {
  id: string
  agent_id: string
  address: string
  unit_number: string | null
  city: string | null
  state: string | null
  zip: string | null
  bedrooms: number | null
  bathrooms: number | null
  rent_amount: number | null
  /** Square feet; maps to `units.size` in Supabase. */
  size_sf: number | null
  ttlock_id: number | null
  /** Expected position for public tour check-in (nullable until agent sets pin). */
  tour_checkin_latitude: number | null
  tour_checkin_longitude: number | null
  status: UnitStatus
  created_at: string
}

export interface ContactUnit {
  id: string
  contact_id: string
  unit_id: string
  role: string
  created_at: string
  /** Populated from leasing_opportunities.stage when mapped from DB. */
  stage?: LeasingPipelineStage | null
  unit?: Unit
  contact?: Contact
}

export interface Communication {
  id: string
  contact_id: string
  agent_id: string
  type: CommunicationType
  direction: CommunicationDirection
  subject: string | null
  body: string | null
  duration_sec: number | null
  created_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIConversation {
  id: string
  agent_id: string
  contact_id: string | null
  messages: AIMessage[]
  created_at: string
  updated_at: string
}

export interface LeasingOpportunity {
  id: string
  contact_id: string
  unit_id: string
  stage: LeasingPipelineStage
  inquired_date: string | null
  qualified_date: string | null
  showing_date: string | null
  toured_date: string | null
  feedback_date: string | null
  applied_date: string | null
  feedback: string | null
  created_at: string
  updated_at: string
  contact?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    type: string
  }
  unit?: {
    id: string
    address: string
    unit_number: string | null
    city: string | null
    state: string | null
    rent_amount: number | null
  }
}

export const LEASING_STAGE_LABELS: Record<LeasingPipelineStage, string> = {
  inquired: 'Inquired',
  qualified: 'Qualified',
  showing: 'Showing',
  toured: 'Toured',
  feedback: 'Feedback',
  applied: 'Applied',
}

/**
 * Maps each pipeline stage to the DB date column that drives it.
 * 'inquired' has no date column — it is the ELSE branch in the generated column.
 */
export const LEASING_STAGE_DATE_FIELD: Record<LeasingPipelineStage, string | null> = {
  inquired: null,
  qualified: 'qualified_date',
  showing: 'showing_date',
  toured: 'toured_date',
  feedback: 'feedback_date',
  applied: 'applied_date',
}

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  prospect: 'Prospective Tenant',
  tenant: 'Tenant',
}

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  occupied: 'Occupied',
  notice: 'Notice',
  vacant: 'Vacant',
  terminated: 'Terminated',
}
