import type { Unit } from '@/types'
import type { UnitLeasingContact } from '@/lib/domain-mappers'

export interface UnitWithContacts extends Unit {
  leasing_opportunities?: {
    id?: string
    stage?: string
    contact?: UnitLeasingContact | null
  }[]
}
