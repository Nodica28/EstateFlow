'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UNIT_STATUSES, UNIT_STATUS_LABELS, type Unit, type UnitStatus } from '@/types'
import { mapUnitRowFromDb } from '@/lib/domain-mappers'

interface FormState {
  address: string
  bedrooms: string
  bathrooms: string
  rent_amount: string
  size_sf: string
  ttlock_id: string
  status: UnitStatus
}

const EMPTY: FormState = {
  address: '',
  bedrooms: '',
  bathrooms: '',
  rent_amount: '',
  size_sf: '',
  ttlock_id: '',
  status: 'vacant',
}

interface Props {
  onAdded: (unit: Unit) => void
}

export function AddUnitDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleClose() {
    setOpen(false)
    setFields(EMPTY)
    setErrors({})
    setServerError(null)
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!fields.address.trim()) e.address = 'Address is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    setServerError(null)

    const body = {
      address: fields.address.trim(),
      bedrooms: fields.bedrooms ? parseInt(fields.bedrooms, 10) : undefined,
      bathrooms: fields.bathrooms ? parseFloat(fields.bathrooms) : undefined,
      rent_amount: fields.rent_amount ? parseFloat(fields.rent_amount) : undefined,
      size_sf: fields.size_sf ? parseInt(fields.size_sf, 10) : undefined,
      ttlock_id: fields.ttlock_id.trim() ? parseInt(fields.ttlock_id, 10) : undefined,
      status: fields.status,
    }

    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) {
      setServerError(json.error ?? 'Failed to create unit')
      return
    }
    const unit = mapUnitRowFromDb(json.data as Record<string, unknown>)
    onAdded(unit)
    handleClose()
  }

  return (
    <>
      <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Add Unit
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                className="h-8 text-sm"
                placeholder="412 Maple Ave – Apt 1A"
                value={fields.address}
                onChange={(e) => setFields((f) => ({ ...f, address: e.target.value }))}
              />
              {errors.address && <p className="text-destructive text-xs">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  className="h-8 text-sm"
                  value={fields.bedrooms}
                  onChange={(e) => setFields((f) => ({ ...f, bedrooms: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
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
              <Label htmlFor="rent_amount">Monthly rent ($)</Label>
              <Input
                id="rent_amount"
                type="number"
                min={0}
                className="h-8 text-sm"
                value={fields.rent_amount}
                onChange={(e) => setFields((f) => ({ ...f, rent_amount: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="size_sf">Size (sf)</Label>
                <Input
                  id="size_sf"
                  type="number"
                  min={0}
                  className="h-8 text-sm"
                  value={fields.size_sf}
                  onChange={(e) => setFields((f) => ({ ...f, size_sf: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ttlock_id">TTLock ID</Label>
                <Input
                  id="ttlock_id"
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

            {serverError && <p className="text-destructive text-sm">{serverError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Add Unit'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
