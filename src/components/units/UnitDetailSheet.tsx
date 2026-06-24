'use client'

import { useState } from 'react'
import {
  BedDouble,
  Bath,
  DollarSign,
  Building2,
  Users,
  Pencil,
  Trash2,
  Maximize2,
  KeyRound,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  UNIT_STATUSES,
  UNIT_STATUS_LABELS,
  LEASING_STAGE_LABELS,
  LEASING_PIPELINE_STAGES,
  type Unit,
  type UnitStatus,
  type LeasingPipelineStage,
} from '@/types'
import { mapUnitRowFromDb, tenantContactsFromLeasingOpportunities } from '@/lib/domain-mappers'
import { STAGE_COLORS } from '@/components/leasing-opportunities/leasing-utils'
import type { UnitWithContacts } from './unit-types'

const STATUS_COLORS: Record<UnitStatus, string> = {
  occupied: 'bg-blue-100 text-blue-700',
  notice: 'bg-amber-100 text-amber-800',
  vacant: 'bg-green-100 text-green-700',
  terminated: 'bg-muted text-muted-foreground',
}

interface Props {
  unit: UnitWithContacts | null
  onClose: () => void
  onUpdated: (unit: Unit) => void
  onDeleted: (id: string) => void
}

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
            <DialogTitle>Delete unit?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will permanently remove the unit and cannot be undone.
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

export function UnitDetailSheet({ unit, onClose, onUpdated, onDeleted }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [fields, setFields] = useState<{
    address: string
    bedrooms: string
    bathrooms: string
    rent_amount: string
    size_sf: string
    ttlock_id: string
    tour_checkin_latitude: string
    tour_checkin_longitude: string
    status: UnitStatus
  }>({
    address: '',
    bedrooms: '',
    bathrooms: '',
    rent_amount: '',
    size_sf: '',
    ttlock_id: '',
    tour_checkin_latitude: '',
    tour_checkin_longitude: '',
    status: 'vacant',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEditing() {
    if (!unit) return
    setFields({
      address: unit.address,
      bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : '',
      bathrooms: unit.bathrooms != null ? String(unit.bathrooms) : '',
      rent_amount: unit.rent_amount != null ? String(unit.rent_amount) : '',
      size_sf: unit.size_sf != null ? String(unit.size_sf) : '',
      ttlock_id: unit.ttlock_id != null ? String(unit.ttlock_id) : '',
      tour_checkin_latitude:
        unit.tour_checkin_latitude != null ? String(unit.tour_checkin_latitude) : '',
      tour_checkin_longitude:
        unit.tour_checkin_longitude != null ? String(unit.tour_checkin_longitude) : '',
      status: unit.status,
    })
    setError(null)
    setIsEditing(true)
  }

  function fillTourPinFromBrowser() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFields((f) => ({
          ...f,
          tour_checkin_latitude: String(pos.coords.latitude),
          tour_checkin_longitude: String(pos.coords.longitude),
        }))
        setError(null)
      },
      () => setError('Could not read your location. Allow access and try again.'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    )
  }

  async function handleSave() {
    if (!unit) return
    setSaving(true)
    setError(null)

    const latTrim = fields.tour_checkin_latitude.trim()
    const lngTrim = fields.tour_checkin_longitude.trim()
    const latEmpty = latTrim === ''
    const lngEmpty = lngTrim === ''
    if (latEmpty !== lngEmpty) {
      setSaving(false)
      setError('Set both tour check-in latitude and longitude, or leave both empty.')
      return
    }

    const body = {
      address: fields.address,
      bedrooms: fields.bedrooms ? parseInt(fields.bedrooms, 10) : null,
      bathrooms: fields.bathrooms ? parseFloat(fields.bathrooms) : null,
      rent_amount: fields.rent_amount ? parseFloat(fields.rent_amount) : null,
      size_sf: fields.size_sf ? parseInt(fields.size_sf, 10) : null,
      ttlock_id: fields.ttlock_id.trim() ? parseInt(fields.ttlock_id, 10) : null,
      tour_checkin_latitude: latTrim ? parseFloat(latTrim) : null,
      tour_checkin_longitude: lngTrim ? parseFloat(lngTrim) : null,
      status: fields.status,
    }
    const res = await fetch(`/api/units/${unit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to save')
      return
    }
    const updated = mapUnitRowFromDb(json.data as Record<string, unknown>)
    onUpdated(updated)
    setIsEditing(false)
  }

  async function handleDelete() {
    if (!unit) return
    setDeleting(true)
    const res = await fetch(`/api/units/${unit.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to delete')
      return
    }
    onDeleted(unit.id)
    onClose()
  }

  const tenants = tenantContactsFromLeasingOpportunities(unit?.leasing_opportunities)

  return (
    <Sheet
      open={!!unit}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setIsEditing(false)
          setError(null)
        }
      }}
    >
      <SheetContent className="flex w-[420px] flex-col gap-0 p-0 sm:max-w-[420px]">
        {unit && (
          <>
            <SheetHeader className="border-b py-4 pr-14 pl-6">
              <SheetTitle className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{unit.address}</p>
                  <span
                    className={cn(
                      'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_COLORS[unit.status]
                    )}
                  >
                    {UNIT_STATUS_LABELS[unit.status]}
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
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    className="h-8 text-sm"
                    value={fields.address}
                    onChange={(e) => setFields((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Bedrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-sm"
                      value={fields.bedrooms}
                      onChange={(e) => setFields((f) => ({ ...f, bedrooms: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bathrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      className="h-8 text-sm"
                      value={fields.bathrooms}
                      onChange={(e) => setFields((f) => ({ ...f, bathrooms: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Monthly rent ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-sm"
                    value={fields.rent_amount}
                    onChange={(e) => setFields((f) => ({ ...f, rent_amount: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Size (sf)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-sm"
                      value={fields.size_sf}
                      onChange={(e) => setFields((f) => ({ ...f, size_sf: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>TTLock ID</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={fields.ttlock_id}
                      onChange={(e) => setFields((f) => ({ ...f, ttlock_id: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={fields.status}
                    onValueChange={(v) => setFields((f) => ({ ...f, status: v as UnitStatus }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue>{UNIT_STATUS_LABELS[fields.status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {UNIT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Tour check-in pin (WGS-84)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={fillTourPinFromBrowser}
                    >
                      Use my location
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Public tour check-in compares visitors within 100 m of this point. Leave blank
                    to disable.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        className="h-8 text-sm"
                        placeholder="e.g. 40.7128"
                        value={fields.tour_checkin_latitude}
                        onChange={(e) =>
                          setFields((f) => ({ ...f, tour_checkin_latitude: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        className="h-8 text-sm"
                        placeholder="e.g. -74.006"
                        value={fields.tour_checkin_longitude}
                        onChange={(e) =>
                          setFields((f) => ({ ...f, tour_checkin_longitude: e.target.value }))
                        }
                      />
                    </div>
                  </div>
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
                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {unit.bedrooms != null && (
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="text-muted-foreground h-4 w-4" />
                      {unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''}
                    </span>
                  )}
                  {unit.bathrooms != null && (
                    <span className="flex items-center gap-1.5">
                      <Bath className="text-muted-foreground h-4 w-4" />
                      {unit.bathrooms} bath{unit.bathrooms !== 1 ? 's' : ''}
                    </span>
                  )}
                  {unit.rent_amount != null && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="text-muted-foreground h-4 w-4" />
                      {unit.rent_amount.toLocaleString()}/mo
                    </span>
                  )}
                  {unit.size_sf != null && (
                    <span className="flex items-center gap-1.5">
                      <Maximize2 className="text-muted-foreground h-4 w-4" />
                      {unit.size_sf.toLocaleString()} sf
                    </span>
                  )}
                  {unit.ttlock_id != null && (
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="text-muted-foreground h-4 w-4" />
                      TTLock {unit.ttlock_id}
                    </span>
                  )}
                </div>

                {/* Tenants */}
                {tenants.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Current Tenants
                    </p>
                    <div className="space-y-2">
                      {tenants.map((t) => (
                        <div
                          key={t.id}
                          className="bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <Users className="text-muted-foreground h-4 w-4 shrink-0" />
                          <span>
                            {t.first_name} {t.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Active Prospects */}
                {(() => {
                  const prospects = (unit.leasing_opportunities ?? []).filter(
                    (lo) => lo.contact?.type === 'prospect'
                  )
                  if (prospects.length === 0) return null
                  return (
                    <>
                      <Separator className="my-4" />
                      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                        Active Prospects
                      </p>
                      <div className="space-y-2">
                        {prospects.map((lo) =>
                          lo.contact ? (
                            <div
                              key={lo.id ?? lo.contact.id}
                              className="bg-muted/30 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="text-muted-foreground h-4 w-4 shrink-0" />
                                <span>
                                  {lo.contact.first_name} {lo.contact.last_name}
                                </span>
                              </div>
                              {lo.stage &&
                                (LEASING_PIPELINE_STAGES as readonly string[]).includes(
                                  lo.stage
                                ) && (
                                  <span
                                    className={cn(
                                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                      STAGE_COLORS[lo.stage as LeasingPipelineStage]
                                    )}
                                  >
                                    {LEASING_STAGE_LABELS[lo.stage as LeasingPipelineStage]}
                                  </span>
                                )}
                            </div>
                          ) : null
                        )}
                      </div>
                    </>
                  )
                })()}

                {error && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-destructive text-sm">{error}</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
