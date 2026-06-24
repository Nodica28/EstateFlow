'use client'

import { Building2, Users, BedDouble, Bath, DollarSign, Maximize2, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tenantContactsFromLeasingOpportunities } from '@/lib/domain-mappers'
import type { UnitStatus, LeasingPipelineStage } from '@/types'
import { UNIT_STATUS_LABELS, LEASING_STAGE_LABELS, LEASING_PIPELINE_STAGES } from '@/types'
import { STAGE_COLORS } from '@/components/leasing-opportunities/leasing-utils'
import type { UnitWithContacts } from './unit-types'

const STATUS_COLORS: Record<UnitStatus, string> = {
  occupied: 'bg-blue-100 text-blue-700',
  notice: 'bg-amber-100 text-amber-800',
  vacant: 'bg-green-100 text-green-700',
  terminated: 'bg-muted text-muted-foreground',
}

interface Props {
  units: UnitWithContacts[]
  selectedUnitId: string | null
  onSelectUnit: (id: string | null) => void
}

export function UnitTable({ units, selectedUnitId, onSelectUnit }: Props) {
  return (
    <div className="w-full overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b text-left">
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Address</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Status</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Beds / Baths</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Rent</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Size (sf)</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">TTLock</th>
            <th className="text-muted-foreground px-4 py-2.5 font-medium">Contacts</th>
          </tr>
        </thead>
        <tbody>
          {units.length === 0 && (
            <tr>
              <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                No units found.
              </td>
            </tr>
          )}
          {units.map((unit) => {
            const tenants = tenantContactsFromLeasingOpportunities(unit.leasing_opportunities)
            const prospects = (unit.leasing_opportunities ?? []).filter(
              (lo) => lo.contact?.type === 'prospect'
            )
            return (
              <tr
                key={unit.id}
                className={cn(
                  'hover:bg-muted/40 cursor-pointer border-b transition-colors',
                  selectedUnitId === unit.id && 'bg-primary/5'
                )}
                onClick={() => onSelectUnit(selectedUnitId === unit.id ? null : unit.id)}
              >
                <td className="px-4 py-2.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {unit.address}
                      {unit.unit_number ? ` #${unit.unit_number}` : ''}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      STATUS_COLORS[unit.status]
                    )}
                  >
                    {UNIT_STATUS_LABELS[unit.status]}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  <span className="flex flex-wrap items-center gap-2">
                    {unit.bedrooms != null && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" />
                        {unit.bedrooms}
                      </span>
                    )}
                    {unit.bathrooms != null && (
                      <span className="inline-flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {unit.bathrooms}
                      </span>
                    )}
                    {unit.bedrooms == null && unit.bathrooms == null && '—'}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {unit.rent_amount != null ? (
                    <span className="inline-flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      {unit.rent_amount.toLocaleString()}/mo
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {unit.size_sf != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="h-3.5 w-3.5" />
                      {unit.size_sf.toLocaleString()}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {unit.ttlock_id != null ? (
                    <span className="inline-flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5" />
                      {unit.ttlock_id}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {tenants.length === 0 && prospects.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {tenants.map((t) => (
                        <span
                          key={t.id}
                          className="text-muted-foreground inline-flex items-center gap-1 text-sm"
                        >
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {t.first_name} {t.last_name}
                        </span>
                      ))}
                      {prospects.map((lo) =>
                        lo.contact ? (
                          <span
                            key={lo.id ?? lo.contact.id}
                            className="inline-flex items-center gap-1.5 text-sm"
                          >
                            <Users className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                            <span className="text-muted-foreground">
                              {lo.contact.first_name} {lo.contact.last_name}
                            </span>
                            {lo.stage &&
                              (LEASING_PIPELINE_STAGES as readonly string[]).includes(lo.stage) && (
                                <span
                                  className={cn(
                                    'rounded-full px-1.5 py-0.5 text-xs font-medium',
                                    STAGE_COLORS[lo.stage as LeasingPipelineStage]
                                  )}
                                >
                                  {LEASING_STAGE_LABELS[lo.stage as LeasingPipelineStage]}
                                </span>
                              )}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
