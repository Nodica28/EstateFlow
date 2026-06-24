'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveDriversLicenseViewUrl } from '@/lib/drivers-license-url'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types'
import { DriverLicenseGraphic } from './DriverLicenseGraphic'

type SlideField = 'id_front' | 'id_back' | 'id_selfie'

const SLIDES: { field: SlideField; label: string }[] = [
  { field: 'id_front', label: 'Front of ID' },
  { field: 'id_back', label: 'Back of ID' },
  { field: 'id_selfie', label: 'Selfie with ID' },
]

type Props = {
  contact: Pick<Contact, 'id' | 'first_name' | 'last_name' | 'id_front' | 'id_back' | 'id_selfie'>
}

export function LicenseSlideshow({ contact }: Props) {
  const [current, setCurrent] = useState(0)
  const [urls, setUrls] = useState<Record<SlideField, string | null>>({
    id_front: null,
    id_back: null,
    id_selfie: null,
  })
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    Promise.all(
      SLIDES.map(async ({ field }) => {
        const path = contact[field] as string | null
        const url = path ? await resolveDriversLicenseViewUrl(supabase, path) : null
        return [field, url] as const
      })
    ).then((pairs) => {
      if (!cancelled) {
        setUrls(Object.fromEntries(pairs) as Record<SlideField, string | null>)
        setResolving(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [contact.id, contact.id_front, contact.id_back, contact.id_selfie])

  const slide = SLIDES[current]

  function prev() {
    setCurrent((i) => Math.max(0, i - 1))
  }

  function next() {
    setCurrent((i) => Math.min(SLIDES.length - 1, i + 1))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Prev arrow */}
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className={cn(
            'absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full p-1 transition-colors',
            'bg-background/80 border shadow-sm backdrop-blur-sm',
            current === 0 ? 'cursor-not-allowed opacity-30' : 'hover:bg-muted cursor-pointer'
          )}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Image */}
        <DriverLicenseGraphic
          contact={contact}
          imageUrl={urls[slide.field]}
          imageUrlResolving={resolving}
          preferSampleOnly={!contact[slide.field]}
        />

        {/* Next arrow */}
        <button
          type="button"
          onClick={next}
          disabled={current === SLIDES.length - 1}
          className={cn(
            'absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full p-1 transition-colors',
            'bg-background/80 border shadow-sm backdrop-blur-sm',
            current === SLIDES.length - 1
              ? 'cursor-not-allowed opacity-30'
              : 'hover:bg-muted cursor-pointer'
          )}
          aria-label="Next image"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Label + dots + counter */}
      <div className="flex items-center justify-between px-1">
        <span className="text-muted-foreground text-xs font-medium">{slide.label}</span>

        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.field}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to ${s.label}`}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  i === current
                    ? 'bg-foreground'
                    : contact[s.field]
                      ? 'bg-muted-foreground/50'
                      : 'bg-muted-foreground/20'
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-xs">
            {current + 1} / {SLIDES.length}
          </span>
        </div>
      </div>
    </div>
  )
}
