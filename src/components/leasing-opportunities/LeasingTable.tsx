'use client'

import { format } from 'date-fns'
import { LEASING_STAGE_LABELS } from '@/types'
import type { LeasingOpportunity } from '@/types'
import { cn } from '@/lib/utils'
import { STAGE_COLORS, getStageDate } from './leasing-utils'

interface LeasingTableProps {
  opportunities: LeasingOpportunity[]
  selectedId: string | null
  onSelectOpp: (id: string | null) => void
}

export function LeasingTable({ opportunities, selectedId, onSelectOpp }: LeasingTableProps) {
  if (opportunities.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No leasing opportunities found.
      </p>
    )
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
              Contact
            </th>
            <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
              Unit
            </th>
            <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
              Stage
            </th>
            <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
              Stage date
            </th>
            <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => {
            const stageDate = getStageDate(opp, opp.stage)
            return (
              <tr
                key={opp.id}
                onClick={() => onSelectOpp(selectedId === opp.id ? null : opp.id)}
                className={cn(
                  'hover:bg-muted/40 cursor-pointer border-b transition-colors last:border-0',
                  selectedId === opp.id && 'bg-primary/5'
                )}
              >
                <td className="px-4 py-2.5 font-medium">
                  {opp.contact ? `${opp.contact.first_name} ${opp.contact.last_name}` : '—'}
                </td>
                <td className="text-muted-foreground px-4 py-2.5">{opp.unit?.address ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STAGE_COLORS[opp.stage]
                    )}
                  >
                    {LEASING_STAGE_LABELS[opp.stage]}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {stageDate ? format(new Date(stageDate), 'MMM d, yyyy') : '—'}
                </td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {opp.created_at ? format(new Date(opp.created_at), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
