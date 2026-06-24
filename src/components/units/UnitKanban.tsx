'use client'

import { useCallback, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { Users, BedDouble, Bath, DollarSign, Maximize2, KeyRound } from 'lucide-react'
import {
  UNIT_STATUSES,
  UNIT_STATUS_LABELS,
  LEASING_STAGE_LABELS,
  LEASING_PIPELINE_STAGES,
  type UnitStatus,
  type LeasingPipelineStage,
} from '@/types'
import { tenantContactsFromLeasingOpportunities } from '@/lib/domain-mappers'
import { STAGE_COLORS } from '@/components/leasing-opportunities/leasing-utils'
import { cn } from '@/lib/utils'
import type { UnitWithContacts } from './unit-types'

const STATUS_COLORS: Record<UnitStatus, string> = {
  occupied: 'bg-blue-100 text-blue-700',
  notice: 'bg-amber-100 text-amber-800',
  vacant: 'bg-green-100 text-green-700',
  terminated: 'bg-muted text-muted-foreground',
}

function resolveDropStatus(overId: string | number, units: UnitWithContacts[]): UnitStatus | null {
  const id = String(overId)
  if (UNIT_STATUSES.includes(id as UnitStatus)) {
    return id as UnitStatus
  }
  const overUnit = units.find((u) => u.id === id)
  return overUnit ? overUnit.status : null
}

/** Static card body — used in list and under DragOverlay (no transform / overflow issues). */
function UnitCardFace({ unit, className }: { unit: UnitWithContacts; className?: string }) {
  const tenants = tenantContactsFromLeasingOpportunities(unit.leasing_opportunities)
  const prospects = (unit.leasing_opportunities ?? []).filter(
    (lo) => lo.contact?.type === 'prospect'
  )
  return (
    <div className={cn('bg-card rounded-lg border p-3 text-left shadow-sm', className)}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {unit.address}
            {unit.unit_number ? ` #${unit.unit_number}` : ''}
          </p>
          {(unit.city || unit.state) && (
            <p className="text-muted-foreground text-xs">
              {[unit.city, unit.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_COLORS[unit.status]
          )}
        >
          {UNIT_STATUS_LABELS[unit.status]}
        </span>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
        {unit.bedrooms != null && (
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {unit.bedrooms} bd
          </span>
        )}
        {unit.bathrooms != null && (
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {unit.bathrooms} ba
          </span>
        )}
        {unit.rent_amount != null && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {unit.rent_amount.toLocaleString()}/mo
          </span>
        )}
        {unit.size_sf != null && (
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" />
            {unit.size_sf.toLocaleString()} sf
          </span>
        )}
        {unit.ttlock_id != null && (
          <span className="flex items-center gap-1">
            <KeyRound className="h-3.5 w-3.5" />
            {unit.ttlock_id}
          </span>
        )}
      </div>

      {(tenants.length > 0 || prospects.length > 0) && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {tenants.length > 0 && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {tenants
                  .slice(0, 2)
                  .map((t) => `${t.first_name} ${t.last_name}`)
                  .join(', ')}
                {tenants.length > 2 && ` +${tenants.length - 2} more`}
              </span>
            </div>
          )}
          {prospects.slice(0, 2).map((lo) =>
            lo.contact ? (
              <div key={lo.id ?? lo.contact.id} className="flex items-center gap-1.5 text-xs">
                <Users className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <span className="text-muted-foreground truncate">
                  {lo.contact.first_name} {lo.contact.last_name}
                </span>
                {lo.stage && (LEASING_PIPELINE_STAGES as readonly string[]).includes(lo.stage) && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium',
                      STAGE_COLORS[lo.stage as LeasingPipelineStage]
                    )}
                  >
                    {LEASING_STAGE_LABELS[lo.stage as LeasingPipelineStage]}
                  </span>
                )}
              </div>
            ) : null
          )}
          {prospects.length > 2 && (
            <p className="text-muted-foreground text-xs">+{prospects.length - 2} more prospects</p>
          )}
        </div>
      )}
    </div>
  )
}

function KanbanUnitCard({
  unit,
  selectedUnitId,
  onToggleSelect,
}: {
  unit: UnitWithContacts
  selectedUnitId: string | null
  onToggleSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: unit.id,
    data: { unit },
  })

  // Movement is rendered only in DragOverlay — translating the source inside
  // overflow-y-auto columns clips the card and grows scroll width (horizontal bar).
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onToggleSelect()}
      className={cn(
        'touch-none',
        'cursor-grab rounded-lg active:cursor-grabbing',
        isDragging && 'opacity-0',
        selectedUnitId === unit.id && 'ring-primary ring-2'
      )}
    >
      <UnitCardFace unit={unit} className="transition-shadow hover:shadow-md" />
    </div>
  )
}

function KanbanColumn({
  status,
  units,
  selectedUnitId,
  onSelectUnit,
}: {
  status: UnitStatus
  units: UnitWithContacts[]
  selectedUnitId: string | null
  onSelectUnit: (id: string | null) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="bg-muted/30 flex min-h-48 min-w-0 flex-1 flex-col rounded-lg border md:min-w-0">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{UNIT_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{units.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto p-2 transition-colors',
          isOver && 'bg-primary/5 ring-primary/20 ring-2 ring-inset'
        )}
      >
        {units.length === 0 && (
          <p className="text-muted-foreground px-1 py-4 text-center text-xs">No units</p>
        )}
        {units.map((unit) => (
          <KanbanUnitCard
            key={unit.id}
            unit={unit}
            selectedUnitId={selectedUnitId}
            onToggleSelect={() => onSelectUnit(selectedUnitId === unit.id ? null : unit.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface UnitKanbanProps {
  units: UnitWithContacts[]
  selectedUnitId: string | null
  onSelectUnit: (id: string | null) => void
  onStatusChange: (unitId: string, status: UnitStatus) => void
}

export function UnitKanban({
  units,
  selectedUnitId,
  onSelectUnit,
  onStatusChange,
}: UnitKanbanProps) {
  const [activeDragUnit, setActiveDragUnit] = useState<UnitWithContacts | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string
      setActiveDragUnit(units.find((u) => u.id === id) ?? null)
    },
    [units]
  )

  const clearDrag = useCallback(() => {
    setActiveDragUnit(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      clearDrag()
      const { active, over } = event
      if (!over) return

      const unitId = active.id as string
      const newStatus = resolveDropStatus(over.id, units)
      if (newStatus == null) return

      const moving = units.find((u) => u.id === unitId)
      if (!moving || moving.status === newStatus) return

      onStatusChange(unitId, newStatus)

      fetch(`/api/units/${unitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {})
    },
    [units, onStatusChange, clearDrag]
  )

  const handleDragCancel = useCallback(() => {
    clearDrag()
  }, [clearDrag])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:grid md:grid-cols-4 md:gap-3">
        {UNIT_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            units={units.filter((u) => u.status === status)}
            selectedUnitId={selectedUnitId}
            onSelectUnit={onSelectUnit}
          />
        ))}
      </div>

      <DragOverlay adjustScale={false}>
        {activeDragUnit ? (
          <div className="max-w-[min(100vw-2rem,20rem)] cursor-grabbing">
            <UnitCardFace unit={activeDragUnit} className="ring-border shadow-lg ring-2" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
