'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Mail, Phone, Building2, User, Pencil, Link, CheckCircle2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/useUIStore'
import { useContactStore } from '@/stores/useContactStore'
import { CONTACT_TYPE_LABELS, LEASING_STAGE_LABELS } from '@/types'
import type { Contact, ContactType } from '@/types'
import { STAGE_COLORS } from '@/components/leasing-opportunities/leasing-utils'
import { CommunicationFeed } from '@/components/communications/CommunicationFeed'
import { VerifyIdentityModal } from './VerifyIdentityModal'
import { IdVerificationBadge } from './IdVerificationBadge'

function EditForm({
  contact,
  onSave,
  onCancel,
}: {
  contact: Contact
  onSave: (updates: Partial<Contact>) => Promise<void>
  onCancel: () => void
}) {
  const [fields, setFields] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    type: contact.type,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        first_name: fields.first_name,
        last_name: fields.last_name,
        email: fields.email || null,
        phone: fields.phone || null,
        type: fields.type as ContactType,
      })
    } catch (e) {
      setError((e as Error).message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input
            className="h-8 text-sm"
            value={fields.first_name}
            onChange={(e) => setFields((f) => ({ ...f, first_name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input
            className="h-8 text-sm"
            value={fields.last_name}
            onChange={(e) => setFields((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          className="h-8 text-sm"
          type="email"
          value={fields.email}
          onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input
          className="h-8 text-sm"
          value={fields.phone}
          onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={fields.type}
          onValueChange={(v) => setFields((f) => ({ ...f, type: v as ContactType }))}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue>{CONTACT_TYPE_LABELS[fields.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(CONTACT_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export function ContactDetailSheet() {
  const { selectedContactId, setSelectedContact } = useUIStore()
  const { contacts, updateContact } = useContactStore()
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const contact = selectedContactId ? contacts.find((c) => c.id === selectedContactId) : null

  async function handleCopyLink() {
    if (!contact) return
    await navigator.clipboard.writeText(`${window.location.origin}/upload/${contact.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave(updates: Partial<Contact>) {
    if (!contact) return
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to save')
    updateContact(contact.id, updates)
    setIsEditing(false)
  }

  return (
    <Sheet
      open={!!contact}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedContact(null)
          setIsEditing(false)
        }
      }}
    >
      <SheetContent className="flex w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]">
        {contact && (
          <>
            <SheetHeader className="border-b py-4 pr-14 pl-6">
              <SheetTitle className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-muted-foreground text-xs font-normal">
                    {CONTACT_TYPE_LABELS[contact.type]}
                  </p>
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            {isEditing ? (
              <div className="flex-1 overflow-y-auto">
                <EditForm
                  contact={contact}
                  onSave={handleSave}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <Tabs defaultValue="details" className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="mx-6 mt-4 w-auto justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-3 pt-0 pb-2 data-[state=active]:bg-transparent"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="communications"
                    className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-3 pt-0 pb-2 data-[state=active]:bg-transparent"
                  >
                    Communications
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="text-muted-foreground h-4 w-4 shrink-0" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.monthly_income != null && (
                      <p className="text-muted-foreground text-sm">
                        Monthly income: ${contact.monthly_income.toLocaleString()}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      Prior evictions disclosed: {contact.has_evictions ? 'Yes' : 'No'}
                    </p>
                  </div>

                  {/* Units */}
                  {contact.units && contact.units.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                        Linked Units
                      </p>
                      <div className="space-y-2">
                        {contact.units.map((cu) =>
                          cu.unit ? (
                            <div
                              key={cu.id}
                              className="bg-muted/30 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">
                                    {cu.unit.address}
                                    {cu.unit.unit_number ? ` #${cu.unit.unit_number}` : ''}
                                  </p>
                                  {cu.unit.rent_amount && (
                                    <p className="text-muted-foreground text-xs">
                                      ${cu.unit.rent_amount.toLocaleString()}/mo
                                    </p>
                                  )}
                                </div>
                              </div>
                              {cu.stage && (
                                <span
                                  className={cn(
                                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                    STAGE_COLORS[cu.stage]
                                  )}
                                >
                                  {LEASING_STAGE_LABELS[cu.stage]}
                                </span>
                              )}
                            </div>
                          ) : null
                        )}
                      </div>
                    </>
                  )}

                  {/* Identity verification */}
                  <Separator className="my-4" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <IdVerificationBadge
                        verified={!!contact.drivers_license_human_verified_date}
                      />
                      {contact.drivers_license_human_verified_date ? (
                        <p className="text-muted-foreground text-xs">
                          Human-verified on{' '}
                          {format(
                            new Date(contact.drivers_license_human_verified_date),
                            'MMM d, yyyy'
                          )}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          {contact.id_front || contact.id_back || contact.id_selfie
                            ? 'Complete checklist in Verify ID to mark as verified.'
                            : 'No ID images uploaded yet. Share the upload link with the contact.'}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Link className="h-3.5 w-3.5" />
                            Copy upload link
                          </>
                        )}
                      </Button>
                      {(() => {
                        const hasImages = Boolean(
                          contact.id_front || contact.id_back || contact.id_selfie
                        )
                        return (
                          <>
                            {contact.drivers_license_human_verified_date && hasImages && (
                              <VerifyIdentityModal contact={contact} mode="view" />
                            )}
                            {!contact.drivers_license_human_verified_date && (
                              <VerifyIdentityModal contact={contact} disabled={!hasImages} />
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Meta */}
                  <Separator className="my-4" />
                  <p className="text-muted-foreground text-xs">
                    Added {format(new Date(contact.created_at), 'MMM d, yyyy')}
                  </p>
                </TabsContent>

                <TabsContent value="communications" className="flex-1 overflow-hidden">
                  <CommunicationFeed contactId={contact.id} />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
