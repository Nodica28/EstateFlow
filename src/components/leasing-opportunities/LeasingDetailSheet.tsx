'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { User, Building2, Pencil, Trash2, Mail, Phone, CalendarDays } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DateTimePicker, isoToDatetimeLocalValue } from '@/components/ui/datetime-picker'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { LEASING_PIPELINE_STAGES, LEASING_STAGE_DATE_FIELD, LEASING_STAGE_LABELS } from '@/types'
import type { LeasingOpportunity } from '@/types'
import { STAGE_COLORS, getStageDate } from './leasing-utils'

function DeleteConfirmDialog({ onConfirm, loading }: { onConfirm: () => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete opportunity?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will permanently remove this leasing opportunity and cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface Props {
  opp: LeasingOpportunity | null
  onClose: () => void
  onUpdated: (opp: LeasingOpportunity) => void
  onDeleted: (id: string) => void
}

type DateFields = {
  inquired_date: string
  qualified_date: string
  showing_date: string
  toured_date: string
  feedback_date: string
  applied_date: string
  feedback: string
}

export function LeasingDetailSheet({ opp, onClose, onUpdated, onDeleted }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [fields, setFields] = useState<DateFields>({
    inquired_date: '',
    qualified_date: '',
    showing_date: '',
    toured_date: '',
    feedback_date: '',
    applied_date: '',
    feedback: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEditing() {
    if (!opp) return
    setFields({
      inquired_date: isoToDatetimeLocalValue(opp.inquired_date),
      qualified_date: isoToDatetimeLocalValue(opp.qualified_date),
      showing_date: isoToDatetimeLocalValue(opp.showing_date),
      toured_date: isoToDatetimeLocalValue(opp.toured_date),
      feedback_date: isoToDatetimeLocalValue(opp.feedback_date),
      applied_date: isoToDatetimeLocalValue(opp.applied_date),
      feedback: opp.feedback ?? '',
    })
    setError(null)
    setIsEditing(true)
  }

  async function handleSave() {
    if (!opp) return
    setSaving(true)
    setError(null)

    const toIso = (val: string) => (val ? new Date(val).toISOString() : null)

    const body = {
      inquired_date: toIso(fields.inquired_date),
      qualified_date: toIso(fields.qualified_date),
      showing_date: toIso(fields.showing_date),
      toured_date: toIso(fields.toured_date),
      feedback_date: toIso(fields.feedback_date),
      applied_date: toIso(fields.applied_date),
      feedback: fields.feedback || null,
    }

    const res = await fetch(`/api/leasing-opportunities/${opp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      const err = json.error
      setError(typeof err === 'string' ? err : 'Failed to save')
      return
    }
    onUpdated(json.data)
    setIsEditing(false)
  }

  async function handleDelete() {
    if (!opp) return
    setDeleting(true)
    const res = await fetch(`/api/leasing-opportunities/${opp.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to delete')
      return
    }
    onDeleted(opp.id)
    onClose()
  }

  return (
    <Sheet
      open={!!opp}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setIsEditing(false)
          setError(null)
        }
      }}
    >
      <SheetContent className="flex w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]">
        {opp && (
          <>
            <SheetHeader className="border-b py-4 pr-14 pl-6">
              <SheetTitle className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">
                    {opp.contact
                      ? `${opp.contact.first_name} ${opp.contact.last_name}`
                      : 'Leasing Opportunity'}
                  </p>
                  <span
                    className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      STAGE_COLORS[opp.stage]
                    )}
                  >
                    {LEASING_STAGE_LABELS[opp.stage]}
                  </span>
                </div>
                {!isEditing && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={startEditing}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <DeleteConfirmDialog onConfirm={handleDelete} loading={deleting} />
                  </div>
                )}
              </SheetTitle>
            </SheetHeader>

            {isEditing ? (
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Stage dates
                </p>
                {LEASING_PIPELINE_STAGES.map((stage) => {
                  const fieldKey = (LEASING_STAGE_DATE_FIELD[stage] ??
                    'inquired_date') as keyof DateFields
                  return (
                    <div key={stage} className="space-y-1.5">
                      <Label htmlFor={`leasing-stage-date-${fieldKey}`} className="capitalize">
                        {LEASING_STAGE_LABELS[stage]}
                      </Label>
                      <DateTimePicker
                        id={`leasing-stage-date-${fieldKey}`}
                        value={fields[fieldKey]}
                        onChange={(v) => setFields((f) => ({ ...f, [fieldKey]: v }))}
                      />
                    </div>
                  )
                })}

                <Separator />

                <div className="space-y-1.5">
                  <Label>Feedback notes</Label>
                  <textarea
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                    value={fields.feedback}
                    onChange={(e) => setFields((f) => ({ ...f, feedback: e.target.value }))}
                    placeholder="Notes from showing, tour, or application…"
                  />
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Contact info */}
                {opp.contact && (
                  <div className="space-y-2">
                    {opp.contact.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                        <a
                          href={`mailto:${opp.contact.email}`}
                          className="text-primary hover:underline"
                        >
                          {opp.contact.email}
                        </a>
                      </div>
                    )}
                    {opp.contact.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="text-muted-foreground h-4 w-4 shrink-0" />
                        <a href={`tel:${opp.contact.phone}`} className="hover:underline">
                          {opp.contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Unit info */}
                {opp.unit && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Unit
                    </p>
                    <div className="bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">{opp.unit.address}</p>
                        {opp.unit.rent_amount && (
                          <p className="text-muted-foreground text-xs">
                            ${opp.unit.rent_amount.toLocaleString()}/mo
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Stage timeline */}
                <Separator className="my-4" />
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  Stage timeline
                </p>
                <div className="space-y-2">
                  {LEASING_PIPELINE_STAGES.map((stage) => {
                    const dateValue = getStageDate(opp, stage)
                    const isCurrentStage = opp.stage === stage
                    return (
                      <div key={stage} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarDays
                            className={cn(
                              'h-4 w-4',
                              dateValue ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                          <span
                            className={cn(isCurrentStage ? 'font-medium' : 'text-muted-foreground')}
                          >
                            {LEASING_STAGE_LABELS[stage]}
                          </span>
                          {isCurrentStage && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs font-medium',
                                STAGE_COLORS[stage]
                              )}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {dateValue ? format(new Date(dateValue), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Feedback */}
                {opp.feedback && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Feedback
                    </p>
                    <p className="text-sm">{opp.feedback}</p>
                  </>
                )}

                {error && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-destructive text-sm">{error}</p>
                  </>
                )}

                {/* Meta */}
                <Separator className="my-4" />
                <p className="text-muted-foreground text-xs">
                  Created {format(new Date(opp.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
