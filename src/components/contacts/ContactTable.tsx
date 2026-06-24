'use client'

import { format } from 'date-fns'
import { Building2 } from 'lucide-react'
import { IdVerificationBadge } from './IdVerificationBadge'
import { useContactStore } from '@/stores/useContactStore'
import { useUIStore } from '@/stores/useUIStore'
import { CONTACT_TYPE_LABELS } from '@/types'
import { ContactDetailSheet } from './ContactDetailSheet'
import { cn } from '@/lib/utils'

export function ContactTable() {
  const { filteredContacts } = useContactStore()
  const { selectedContactId, setSelectedContact } = useUIStore()

  const contacts = filteredContacts()

  return (
    <>
      <div className="w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b text-left">
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Name</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Type</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Unit</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Contact</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">Created</th>
              <th className="text-muted-foreground px-4 py-2.5 font-medium">ID Verified</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-10 text-center">
                  No contacts found.
                </td>
              </tr>
            )}
            {contacts.map((contact) => {
              const unit = contact.units?.[0]?.unit
              const idVerified = contact.drivers_license_human_verified_date != null
              return (
                <tr
                  key={contact.id}
                  className={cn(
                    'hover:bg-muted/40 cursor-pointer border-b transition-colors',
                    selectedContactId === contact.id && 'bg-primary/5'
                  )}
                  onClick={() =>
                    setSelectedContact(selectedContactId === contact.id ? null : contact.id)
                  }
                >
                  <td className="px-4 py-2.5 font-medium">
                    {contact.first_name} {contact.last_name}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {CONTACT_TYPE_LABELS[contact.type]}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {unit ? (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {unit.address}
                        {unit.unit_number ? ` #${unit.unit_number}` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {contact.email ?? contact.phone ?? '—'}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {format(new Date(contact.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-2.5">
                    <IdVerificationBadge verified={idVerified} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ContactDetailSheet />
    </>
  )
}
