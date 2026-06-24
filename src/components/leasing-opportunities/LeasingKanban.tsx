'use client'

import { useCallback, useState } from 'react'
import { format } from 'date-fns'
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
import { User, Building2 } from 'lucide-react'
import { LEASING_PIPELINE_STAGES, LEASING_STAGE_LABELS } from '@/types'
import type { LeasingOpportunity, LeasingPipelineStage } from '@/types'
import { cn } from '@/lib/utils'
import { STAGE_COLORS, computeOptimisticStageUpdate, getStageDate } from './leasing-utils'

function resolveDropStage(
  overId: string | number,
  opps: LeasingOpportunity[]
): LeasingPipelineStage | null {
  const id = String(overId)
  if ((LEASING_PIPELINE_STAGES as readonly string[]).includes(id)) {
    return id as LeasingPipelineStage
  }
  const overOpp = opps.find((o) => o.id === id)
  return overOpp ? overOpp.stage : null
}

function LeasingCardFace({ opp, className }: { opp: LeasingOpportunity; className?: string }) {
  const stageDate = getStageDate(opp, opp.stage)
  return (
    <div className={cn('bg-card rounded-lg border p-3 text-left shadow-sm', className)}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {opp.contact && (
            <p className="truncate text-sm font-medium">
              {opp.contact.first_name} {opp.contact.last_name}
            </p>
          )}
          {opp.unit && <p className="text-muted-foreground truncate text-xs">{opp.unit.address}</p>}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            STAGE_COLORS[opp.stage]
          )}
        >
          {LEASING_STAGE_LABELS[opp.stage]}
        </span>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
        {opp.contact && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {opp.contact.type === 'tenant' ? 'Tenant' : 'Prospect'}
          </span>
        )}
        {opp.unit?.rent_amount && (
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />${opp.unit.rent_amount.toLocaleString()}/mo
          </span>
        )}
      </div>

      {stageDate && (
        <p className="text-muted-foreground mt-1.5 border-t pt-1.5 text-xs">
          {format(new Date(stageDate), 'MMM d, yyyy')}
        </p>
      )}
    </div>
  )
}

function KanbanCard({
  opp,
  selectedId,
  onToggleSelect,
}: {
  opp: LeasingOpportunity
  selectedId: string | null
  onToggleSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opp.id,
    data: { opp },
  })

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
        selectedId === opp.id && 'ring-primary ring-2'
      )}
    >
      <LeasingCardFace opp={opp} className="transition-shadow hover:shadow-md" />
    </div>
  )
}

function KanbanColumn({
  stage,
  opps,
  selectedId,
  onSelectOpp,
}: {
  stage: LeasingPipelineStage
  opps: LeasingOpportunity[]
  selectedId: string | null
  onSelectOpp: (id: string | null) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="bg-muted/30 flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border md:h-full md:overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{LEASING_STAGE_LABELS[stage]}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{opps.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto p-2 transition-colors md:min-h-0',
          isOver && 'bg-primary/5 ring-primary/20 ring-2 ring-inset'
        )}
      >
        {opps.length === 0 && (
          <p className="text-muted-foreground px-1 py-4 text-center text-xs">No opportunities</p>
        )}
        {opps.map((opp) => (
          <KanbanCard
            key={opp.id}
            opp={opp}
            selectedId={selectedId}
            onToggleSelect={() => onSelectOpp(selectedId === opp.id ? null : opp.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface LeasingKanbanProps {
  opportunities: LeasingOpportunity[]
  selectedId: string | null
  onSelectOpp: (id: string | null) => void
  onStageChange: (id: string, stage: LeasingPipelineStage, updated: LeasingOpportunity) => void
}

export function LeasingKanban({
  opportunities,
  selectedId,
  onSelectOpp,
  onStageChange,
}: LeasingKanbanProps) {
  const [activeDragOpp, setActiveDragOpp] = useState<LeasingOpportunity | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string
      setActiveDragOpp(opportunities.find((o) => o.id === id) ?? null)
    },
    [opportunities]
  )

  const clearDrag = useCallback(() => setActiveDragOpp(null), [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      clearDrag()
      const { active, over } = event
      if (!over) return

      const oppId = active.id as string
      const targetStage = resolveDropStage(over.id, opportunities)
      if (!targetStage) return

      const moving = opportunities.find((o) => o.id === oppId)
      if (!moving || moving.stage === targetStage) return

      const optimistic = computeOptimisticStageUpdate(moving, targetStage)
      onStageChange(oppId, targetStage, optimistic)

      fetch(`/api/leasing-opportunities/${oppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.data) onStageChange(oppId, targetStage, json.data)
        })
        .catch(() => {})
    },
    [opportunities, onStageChange, clearDrag]
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
      <div className="flex w-full min-w-0 flex-col gap-3 md:grid md:h-full md:min-h-0 md:flex-1 md:grid-cols-6 md:grid-rows-[minmax(0,1fr)] md:gap-3">
        {LEASING_PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            opps={opportunities.filter((o) => o.stage === stage)}
            selectedId={selectedId}
            onSelectOpp={onSelectOpp}
          />
        ))}
      </div>

      <DragOverlay adjustScale={false}>
        {activeDragOpp ? (
          <div className="max-w-[min(100vw-2rem,18rem)] cursor-grabbing">
            <LeasingCardFace opp={activeDragOpp} className="ring-border shadow-lg ring-2" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
