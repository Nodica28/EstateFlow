'use client'

import { useState } from 'react'
import { IdCard, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Contact } from '@/types'
import { LicenseChecklistForm } from './LicenseChecklistForm'

type VerifyIdentityModalProps = {
  contact: Contact
  /** `view` opens read-only license image for already-verified contacts. */
  mode?: 'verify' | 'view'
  disabled?: boolean
}

export function VerifyIdentityModal({
  contact,
  mode = 'verify',
  disabled = false,
}: VerifyIdentityModalProps) {
  const [open, setOpen] = useState(false)
  const isView = mode === 'view'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" disabled={disabled}>
            {isView ? (
              <>
                <IdCard className="h-3.5 w-3.5" />
                View license
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Verify ID
              </>
            )}
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isView
              ? `Driver license — ${contact.first_name} ${contact.last_name}`
              : `Verify Identity — ${contact.first_name} ${contact.last_name}`}
          </DialogTitle>
        </DialogHeader>
        <LicenseChecklistForm
          key={`${contact.id}-${mode}-${open ? 'open' : 'closed'}`}
          contact={contact}
          showStoredImage={Boolean(contact.id_front || contact.id_back || contact.id_selfie)}
          readOnly={isView}
          onVerified={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
