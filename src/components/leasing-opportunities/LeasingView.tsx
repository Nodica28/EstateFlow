'use client'

import { useCallback, useState } from 'react'
import { FileText, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { LeasingOpportunity, LeasingPipelineStage } from '@/types'
import { useUIStore } from '@/stores/useUIStore'
import { AddLeasingOpportunityDialog } from './AddLeasingOpportunityDialog'
import { LeasingDetailSheet } from './LeasingDetailSheet'
import { LeasingKanban } from './LeasingKanban'
import { LeasingTable } from './LeasingTable'

interface Props {
  initialOpportunities: LeasingOpportunity[]
}

export function LeasingView({ initialOpportunities }: Props) {
  const { leasingViewMode, setLeasingViewMode } = useUIStore()
  const [search, setSearch] = useState('')
  const [opportunities, setOpportunities] = useState<LeasingOpportunity[]>(initialOpportunities)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedOpp = selectedId ? (opportunities.find((o) => o.id === selectedId) ?? null) : null

  const filtered = opportunities.filter((opp) => {
    if (!search) return true
    const q = search.toLowerCase()
    const contactName = opp.contact
      ? `${opp.contact.first_name} ${opp.contact.last_name}`.toLowerCase()
      : ''
    const unitAddr = opp.unit?.address.toLowerCase() ?? ''
    return contactName.includes(q) || unitAddr.includes(q)
  })

  const handleStageChange = useCallback(
    (id: string, _stage: LeasingPipelineStage, updated: LeasingOpportunity) => {
      setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)))
    },
    []
  )

  function handleAdded(opp: LeasingOpportunity) {
    setOpportunities((prev) => [opp, ...prev])
  }

  function handleUpdated(opp: LeasingOpportunity) {
    setOpportunities((prev) => prev.map((o) => (o.id === opp.id ? opp : o)))
  }

  function handleDeleted(id: string) {
    setOpportunities((prev) => prev.filter((o) => o.id !== id))
    setSelectedId(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by contact or unit…"
          className="h-8 max-w-xs text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="bg-muted/60 flex items-center rounded-md border p-0.5">
          <Button
            type="button"
            variant={leasingViewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setLeasingViewMode('board')}
            aria-pressed={leasingViewMode === 'board'}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </Button>
          <Button
            type="button"
            variant={leasingViewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setLeasingViewMode('list')}
            aria-pressed={leasingViewMode === 'list'}
          >
            <List className="h-3.5 w-3.5" />
            List
          </Button>
        </div>
        <div className="ml-auto">
          <AddLeasingOpportunityDialog onAdded={handleAdded} />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="text-muted-foreground/30 mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">No leasing opportunities found.</p>
        </div>
      )}

      {filtered.length > 0 && leasingViewMode === 'board' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto md:overflow-hidden">
          <LeasingKanban
            opportunities={filtered}
            selectedId={selectedId}
            onSelectOpp={setSelectedId}
            onStageChange={handleStageChange}
          />
        </div>
      )}

      {filtered.length > 0 && leasingViewMode === 'list' && (
        <div className="min-h-0 flex-1 overflow-auto">
          <LeasingTable
            opportunities={filtered}
            selectedId={selectedId}
            onSelectOpp={setSelectedId}
          />
        </div>
      )}

      <LeasingDetailSheet
        opp={selectedOpp}
        onClose={() => setSelectedId(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
