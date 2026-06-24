'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Building2, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { LicenseChecklistForm } from '@/components/contacts/LicenseChecklistForm'
import { IdVerificationBadge } from '@/components/contacts/IdVerificationBadge'
import { useContactStore } from '@/stores/useContactStore'
import type { Contact } from '@/types'
import { CONTACT_TYPE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

/** Newest first, same as contacts table default. */
function sortByCreatedDesc(a: Contact, b: Contact) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

/** Queue: license picture on file + not human-verified (server-filtered). */
function isLicenseReviewQueueContact(c: Contact) {
  return (
    (Boolean(c.id_front) || Boolean(c.id_back) || Boolean(c.id_selfie)) &&
    !c.drivers_license_human_verified_date
  )
}

export function LicenseReviewView({ initialContacts }: { initialContacts: Contact[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateContact } = useContactStore()
  const [contacts, setContacts] = useState(initialContacts)

  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts])

  const sortedContacts = useMemo(
    () => [...contacts].filter(isLicenseReviewQueueContact).sort(sortByCreatedDesc),
    [contacts]
  )

  const queueCount = sortedContacts.length

  const paramId = searchParams.get('id')
  const selectedId = useMemo(() => {
    if (paramId && sortedContacts.some((c) => c.id === paramId)) return paramId
    return sortedContacts[0]?.id ?? null
  }, [paramId, sortedContacts])

  const selected = selectedId ? contacts.find((c) => c.id === selectedId) : undefined

  const selectedUnit = selected?.units?.[0]?.unit

  const selectContact = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('id', id)
      router.push(`/license-review?${next.toString()}`)
    },
    [router, searchParams]
  )

  const onVerified = useCallback(
    (updated: Contact) => {
      updateContact(updated.id, updated)
      setContacts((prev) => {
        const merged = prev.map((c) => (c.id === updated.id ? updated : c))
        const queue = merged.filter(isLicenseReviewQueueContact).sort(sortByCreatedDesc)
        const nextId = queue.find((c) => c.id !== updated.id)?.id
        if (nextId) queueMicrotask(() => selectContact(nextId))
        else queueMicrotask(() => router.replace('/license-review'))
        return queue
      })
    },
    [updateContact, selectContact, router]
  )

  return (
    <div className="flex h-full min-h-0">
      <aside className="bg-muted/30 flex w-[22rem] shrink-0 flex-col border-r">
        <div className="border-b px-3 py-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Pending license review
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
            {queueCount === 0
              ? 'No license images awaiting verification'
              : `${queueCount} with license image · not ID-verified`}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sortedContacts.length === 0 ? (
            <p className="text-muted-foreground px-2 py-4 text-center text-sm">
              No contacts have a license picture waiting for verification. Verified contacts and
              contacts without a license file are hidden here.
            </p>
          ) : (
            <ul className="space-y-1">
              {sortedContacts.map((c) => {
                const unit = c.units?.[0]?.unit
                const active = c.id === selectedId
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectContact(c.id)}
                      className={cn(
                        'flex w-full flex-col items-start gap-1 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <span className={cn('w-full truncate', active && 'font-semibold')}>
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="text-muted-foreground w-full truncate text-xs font-normal">
                        {CONTACT_TYPE_LABELS[c.type]}
                      </span>
                      <span className="text-muted-foreground w-full truncate text-xs font-normal">
                        {c.email ?? c.phone ?? '—'}
                      </span>
                      <span className="text-muted-foreground flex w-full items-center gap-1 text-xs font-normal">
                        <Building2 className="h-3 w-3 shrink-0 opacity-70" />
                        <span className="truncate">
                          {unit
                            ? `${unit.address}${unit.unit_number ? ` #${unit.unit_number}` : ''}`
                            : '—'}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs font-normal">
                        Created {format(new Date(c.created_at), 'MMM d, yyyy')}
                      </span>
                      <IdVerificationBadge verified={false} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!selected || !isLicenseReviewQueueContact(selected) ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
            {sortedContacts.length === 0 ? (
              <p>Nothing in the review queue right now.</p>
            ) : (
              <p>Select a contact from the list.</p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-lg space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selected.first_name} {selected.last_name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {CONTACT_TYPE_LABELS[selected.type]} · {selected.email ?? 'No email'} ·{' '}
                    {selected.phone ?? 'No phone'}
                  </p>
                  {selectedUnit ? (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {selectedUnit.address}
                        {selectedUnit.unit_number ? ` #${selectedUnit.unit_number}` : ''}
                      </span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-sm">Unit —</p>
                  )}
                  <p className="text-muted-foreground mt-1 text-sm">
                    Created {format(new Date(selected.created_at), 'MMM d, yyyy')}
                  </p>
                  <div className="mt-2 space-y-1">
                    <IdVerificationBadge verified={false} />
                    <p className="text-muted-foreground text-xs">
                      Check all fields below against the license image on file.
                    </p>
                  </div>
                </div>
                <Link
                  href="/contacts"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'shrink-0 gap-1.5'
                  )}
                >
                  Contacts
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <LicenseChecklistForm
                key={selected.id}
                contact={selected}
                onVerified={onVerified}
                showStoredImage
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
