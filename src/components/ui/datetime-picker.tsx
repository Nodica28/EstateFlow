'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Parse `YYYY-MM-DDTHH:mm` as local wall time. */
export function parseDatetimeLocalString(value: string): Date | undefined {
  if (!value) return undefined
  const [datePart, timePart = '00:00'] = value.split('T')
  if (!datePart) return undefined
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h = 0, mi = 0] = timePart.split(':').map(Number)
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0)
  return Number.isNaN(dt.getTime()) ? undefined : dt
}

function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Map an ISO timestamp from the API into `YYYY-MM-DDTHH:mm` in local time. */
export function isoToDatetimeLocalValue(isoString: string | null): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  return toDatetimeLocalString(d)
}

export interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
}

export function DateTimePicker({ value, onChange, disabled, id, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseDatetimeLocalString(value)

  const timeStr = React.useMemo(() => {
    if (!value || !value.includes('T')) return '09:00'
    return value.slice(11, 16)
  }, [value])

  const applyDate = React.useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange('')
        return
      }
      const [h, m] = timeStr.split(':').map(Number)
      const next = new Date(date)
      next.setHours(h || 0, m || 0, 0, 0)
      onChange(toDatetimeLocalString(next))
    },
    [onChange, timeStr]
  )

  const applyTime = React.useCallback(
    (t: string) => {
      const base = selected ?? new Date()
      const [h, m] = t.split(':').map(Number)
      const next = new Date(base)
      next.setHours(h || 0, m || 0, 0, 0)
      onChange(toDatetimeLocalString(next))
    },
    [onChange, selected]
  )

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next)}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        id={id}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'h-8 w-full min-w-0 justify-start gap-2 px-3 font-normal',
          !selected && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="text-muted-foreground h-4 w-4 shrink-0" />
        <span className="truncate">
          {selected ? format(selected, 'MMM d, yyyy h:mm a') : 'Pick date & time'}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={applyDate} />
        <div className="space-y-2 border-t p-3">
          <p className="text-muted-foreground text-xs font-medium">Time</p>
          <Input
            type="time"
            className="h-8"
            value={timeStr}
            onChange={(e) => applyTime(e.target.value)}
            step={60}
          />
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 w-full text-xs"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              Clear date
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
