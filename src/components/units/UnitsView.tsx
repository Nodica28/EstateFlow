'use client'

import { useCallback, useState } from 'react'
import { Building2, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Unit, UnitStatus } from '@/types'
import { useUIStore } from '@/stores/useUIStore'
import { AddUnitDialog } from './AddUnitDialog'
import { UnitDetailSheet } from './UnitDetailSheet'
import { UnitKanban } from './UnitKanban'
import { UnitTable } from './UnitTable'
import type { UnitWithContacts } from './unit-types'

export function UnitsView({ initialUnits }: { initialUnits: UnitWithContacts[] }) {
  const { unitsViewMode, setUnitsViewMode } = useUIStore()
  const [search, setSearch] = useState('')
  const [units, setUnits] = useState<UnitWithContacts[]>(initialUnits)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)

  const selectedUnit = selectedUnitId ? (units.find((u) => u.id === selectedUnitId) ?? null) : null

  const filtered = units.filter(
    (u) => !search || u.address.toLowerCase().includes(search.toLowerCase())
  )

  const handleStatusChange = useCallback((unitId: string, status: UnitStatus) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, status } : u)))
  }, [])

  function handleAdded(unit: Unit) {
    setUnits((prev) => [{ ...unit, leasing_opportunities: [] }, ...prev])
  }

  function handleUpdated(unit: Unit) {
    setUnits((prev) => prev.map((u) => (u.id === unit.id ? { ...u, ...unit } : u)))
  }

  function handleDeleted(id: string) {
    setUnits((prev) => prev.filter((u) => u.id !== id))
    setSelectedUnitId(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search units..."
          className="h-8 max-w-xs text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="bg-muted/60 flex items-center rounded-md border p-0.5">
          <Button
            type="button"
            variant={unitsViewMode === 'board' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setUnitsViewMode('board')}
            aria-pressed={unitsViewMode === 'board'}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </Button>
          <Button
            type="button"
            variant={unitsViewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setUnitsViewMode('list')}
            aria-pressed={unitsViewMode === 'list'}
          >
            <List className="h-3.5 w-3.5" />
            List
          </Button>
        </div>
        <div className="ml-auto">
          <AddUnitDialog onAdded={handleAdded} />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="text-muted-foreground/30 mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">No units found.</p>
        </div>
      )}

      {filtered.length > 0 && unitsViewMode === 'board' && (
        <div className="min-h-0 flex-1">
          <UnitKanban
            units={filtered}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {filtered.length > 0 && unitsViewMode === 'list' && (
        <div className="min-h-0 flex-1 overflow-auto">
          <UnitTable
            units={filtered}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
          />
        </div>
      )}

      <UnitDetailSheet
        unit={selectedUnit}
        onClose={() => setSelectedUnitId(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
