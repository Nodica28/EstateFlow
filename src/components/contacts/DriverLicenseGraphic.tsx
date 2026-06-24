'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LicensePerson = {
  first_name: string
  last_name: string
}

type Props = {
  contact: LicensePerson
  /** Public or signed URL from storage, or null while loading / unavailable */
  imageUrl: string | null
  /** True while the signed/public URL is being resolved (not yet in imageUrl). */
  imageUrlResolving?: boolean
  /** When true, always show the dashed sample card (no upload URL). */
  preferSampleOnly: boolean
  className?: string
  innerClassName?: string
}

type InnerProps = {
  contact: LicensePerson
  imageUrl: string | null
  imageUrlResolving: boolean
  preferSampleOnly: boolean
  innerClassName?: string
}

function SampleLicenseCard({ contact }: { contact: LicensePerson }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="border-muted-foreground/30 rounded-md border-2 border-dashed px-6 py-4 text-center">
        <p className="text-muted-foreground text-xs">Sample Driver License</p>
        <p className="mt-1 text-sm font-semibold">
          {contact.first_name?.toUpperCase()} {contact.last_name?.toUpperCase()}
        </p>
        <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 text-left text-xs">
          <span>DOB: 01/01/1990</span>
          <span>EXP: 12/31/2028</span>
          <span>DL#: D1234567</span>
          <span>CLASS: C</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Keyed by `imageUrl` from parent so load failure state resets when the URL changes.
 */
function LicensePreviewInner({
  contact,
  imageUrl,
  imageUrlResolving,
  preferSampleOnly,
  innerClassName,
}: InnerProps) {
  const [uploadLoadFailed, setUploadLoadFailed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const canTryUpload = !preferSampleOnly && imageUrl != null && imageUrl.length > 0
  const showUpload = canTryUpload && !uploadLoadFailed
  const decodingImage = showUpload && !imageLoaded
  const showLoader = imageUrlResolving || decodingImage

  return (
    <div className={cn(innerClassName ?? 'relative h-56 w-full', 'bg-muted/50')}>
      {showUpload ? (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase URLs
        <img
          src={imageUrl}
          alt={`Driver license for ${contact.first_name} ${contact.last_name}`}
          className={cn(
            'h-full w-full object-contain p-2 transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setUploadLoadFailed(true)
            setImageLoaded(true)
          }}
        />
      ) : null}

      {!showUpload && !imageUrlResolving ? (
        <div className="relative h-full w-full">
          <SampleLicenseCard contact={contact} />
        </div>
      ) : null}

      {imageUrlResolving && !showUpload ? (
        <div className="bg-muted/60 absolute inset-0 animate-pulse" aria-hidden />
      ) : null}

      {showLoader ? (
        <div
          className="bg-background/70 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-label="Loading license image"
        >
          <Loader2 className="text-muted-foreground h-9 w-9 animate-spin" />
          <span className="text-muted-foreground text-xs font-medium">Loading license image…</span>
        </div>
      ) : null}
    </div>
  )
}

/**
 * License preview: try uploaded image when allowed; on error or missing URL,
 * show the dashed sample card (no missing static PNGs under /public/licenses).
 */
export function DriverLicenseGraphic({
  contact,
  imageUrl,
  imageUrlResolving = false,
  preferSampleOnly,
  className,
  innerClassName,
}: Props) {
  return (
    <div className={className ?? 'bg-muted overflow-hidden rounded-lg border'}>
      <LicensePreviewInner
        key={imageUrl ?? ''}
        contact={contact}
        imageUrl={imageUrl}
        imageUrlResolving={preferSampleOnly ? false : imageUrlResolving}
        preferSampleOnly={preferSampleOnly}
        innerClassName={innerClassName}
      />
    </div>
  )
}
