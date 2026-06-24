'use client'

import { useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContactStore } from '@/stores/useContactStore'
import type { Contact } from '@/types'
import { cn } from '@/lib/utils'
import { LicenseSlideshow } from './LicenseSlideshow'

const VERIFY_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'address', label: 'Address' },
  { key: 'license_number', label: 'License Number' },
  { key: 'expiry', label: 'Expiry Date' },
]

type Props = {
  contact: Contact
  onVerified?: (contact: Contact) => void
  /** When true, show the uploaded images (slideshow). When false, slideshows shows placeholders. */
  showStoredImage?: boolean
  /** Slideshow + no checklist or verify action. */
  readOnly?: boolean
}

export function LicenseChecklistForm({
  contact,
  onVerified,
  showStoredImage = false,
  readOnly = false,
}: Props) {
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateContact } = useContactStore()

  function toggleField(key: string) {
    setCheckedFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const allChecked = checkedFields.size === VERIFY_FIELDS.length

  async function handleVerify() {
    if (!allChecked) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}/verify`, { method: 'POST' })
      const json = (await res.json()) as { data?: Contact; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Verification failed')
      if (json.data) {
        updateContact(contact.id, json.data)
        onVerified?.(json.data)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (readOnly) {
    return (
      <div className="space-y-4">
        <LicenseSlideshow contact={contact} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showStoredImage && <LicenseSlideshow contact={contact} />}

      <div>
        <p className="mb-2 text-sm font-medium">
          Confirm the following fields match the applicant:
        </p>
        <div className="space-y-2">
          {VERIFY_FIELDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={cn(
                'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
                checkedFields.has(key)
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'hover:bg-muted/50'
              )}
              onClick={() => toggleField(key)}
            >
              {checkedFields.has(key) ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <Circle className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full gap-2"
        disabled={!allChecked || isSubmitting}
        onClick={handleVerify}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {allChecked
          ? 'Confirm Verification'
          : `Check all fields (${checkedFields.size}/${VERIFY_FIELDS.length})`}
      </Button>
    </div>
  )
}
