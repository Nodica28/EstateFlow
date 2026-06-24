'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LeasingOpportunity } from '@/types'

interface SimpleContact {
  id: string
  first_name: string
  last_name: string
  type: string
}

interface SimpleUnit {
  id: string
  name: string
}

interface Props {
  onAdded: (opp: LeasingOpportunity) => void
}

export function AddLeasingOpportunityDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState<SimpleContact[]>([])
  const [units, setUnits] = useState<SimpleUnit[]>([])
  const [contactId, setContactId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function loadOptions() {
    setFetching(true)
    Promise.all([
      fetch('/api/contacts?limit=200').then((r) => r.json()),
      fetch('/api/units').then((r) => r.json()),
    ])
      .then(([c, u]) => {
        setContacts(c.data ?? [])
        setUnits(u.data ?? [])
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) {
      loadOptions()
    } else {
      setContactId('')
      setUnitId('')
      setError(null)
    }
  }

  async function handleSubmit() {
    if (!contactId || !unitId) {
      setError('Please select both a contact and a unit.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/leasing-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contactId, unit_id: unitId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      const err = json.error
      setError(
        typeof err === 'string'
          ? err
          : err?.fieldErrors
            ? Object.values(err.fieldErrors).flat().join(', ')
            : 'Failed to create'
      )
      return
    }
    onAdded(json.data)
    handleOpenChange(false)
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => handleOpenChange(true)}>
        <Plus className="h-4 w-4" />
        Add opportunity
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New leasing opportunity</DialogTitle>
          </DialogHeader>

          {fetching ? (
            <p className="text-muted-foreground py-4 text-center text-sm">Loading…</p>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Select value={contactId} onValueChange={(v) => setContactId(v ?? '')}>
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Select a contact…">
                      {contactId
                        ? (() => {
                            const c = contacts.find((x) => x.id === contactId)
                            return c
                              ? `${c.first_name} ${c.last_name}${c.type === 'tenant' ? ' (Tenant)' : ''}`
                              : 'Select a contact…'
                          })()
                        : 'Select a contact…'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                        {c.type === 'tenant' ? ' (Tenant)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={unitId} onValueChange={(v) => setUnitId(v ?? '')}>
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Select a unit…">
                      {unitId
                        ? (units.find((x) => x.id === unitId)?.name ?? 'Select a unit…')
                        : 'Select a unit…'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
