'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useContactStore } from '@/stores/useContactStore'
import { CONTACT_TYPE_LABELS } from '@/types'
import type { Contact } from '@/types'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  type: z.enum(['prospect', 'tenant']),
})

type FormValues = z.infer<typeof schema>

export function AddContactDialog() {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { addContact } = useContactStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'prospect' },
  })

  function handleClose() {
    setOpen(false)
    reset()
    setServerError(null)
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        email: values.email || undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error ?? 'Failed to create contact')
      return
    }
    addContact(json.data as Contact)
    handleClose()
  }

  const contactType = watch('type')

  return (
    <>
      <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Add Contact
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" {...register('first_name')} className="h-8 text-sm" />
                {errors.first_name && (
                  <p className="text-destructive text-xs">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" {...register('last_name')} className="h-8 text-sm" />
                {errors.last_name && (
                  <p className="text-destructive text-xs">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} className="h-8 text-sm" />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                className="h-8 text-sm"
                placeholder="10-digit number"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={contactType}
                onValueChange={(v) => setValue('type', v as FormValues['type'])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue>{CONTACT_TYPE_LABELS[contactType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CONTACT_TYPE_LABELS) as [string, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {serverError && <p className="text-destructive text-sm">{serverError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Add Contact'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
