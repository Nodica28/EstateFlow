'use client'

import { useRef, useState } from 'react'
import { Camera, CreditCard, CheckCircle2, Loader2, AlertCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compressImageForUpload } from '@/lib/compressImageForUpload'
import type { IdUploadType } from '@/types'

type SlotState = {
  file: File | null
  preview: string | null
  status: 'idle' | 'uploading' | 'done' | 'error'
  errorMsg: string | null
}

type SlotConfig = {
  type: IdUploadType
  label: string
  hint: string
  capture: 'environment' | 'user'
  Icon: React.ComponentType<{ className?: string }>
}

const SLOTS: SlotConfig[] = [
  {
    type: 'front_of_id',
    label: 'Front of ID',
    hint: "Driver's license or state ID — front side",
    capture: 'environment',
    Icon: CreditCard,
  },
  {
    type: 'back_of_id',
    label: 'Back of ID',
    hint: "Driver's license or state ID — back side",
    capture: 'environment',
    Icon: CreditCard,
  },
  {
    type: 'selfie_with_id',
    label: 'Selfie with ID',
    hint: 'Hold your ID next to your face',
    capture: 'user',
    Icon: Camera,
  },
]

const INITIAL_SLOTS: Record<IdUploadType, SlotState> = {
  front_of_id: { file: null, preview: null, status: 'idle', errorMsg: null },
  back_of_id: { file: null, preview: null, status: 'idle', errorMsg: null },
  selfie_with_id: { file: null, preview: null, status: 'idle', errorMsg: null },
}

type UploadApiJson = { success?: boolean; error?: string }

/** Avoid `res.json()` on HTML/plain error bodies — Safari surfaces that as "The string did not match the expected pattern." */
function parseUploadResponse(
  res: Response,
  raw: string
): { ok: true } | { ok: false; error: string } {
  const text = raw.trim()
  if (!text) {
    return {
      ok: false,
      error: res.ok
        ? 'Empty server response. Please try again.'
        : `Upload failed (${res.status}). Please try again.`,
    }
  }
  let body: UploadApiJson
  try {
    body = JSON.parse(text) as UploadApiJson
  } catch {
    return {
      ok: false,
      error: res.ok
        ? 'Unexpected server response. Please try again.'
        : `Upload failed (${res.status}). Please try again.`,
    }
  }
  if (!res.ok) {
    return { ok: false, error: body.error ?? 'Upload failed' }
  }
  return { ok: true }
}

function errorMessageFromUnknown(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Upload failed. Please try again.'
}

function SuccessScreen({ contactName }: { contactName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-xl font-semibold">Documents submitted</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Thank you, {contactName}. Your documents have been received and will be reviewed shortly.
      </p>
    </div>
  )
}

export function IdUploadClient({
  contactId,
  contactName,
}: {
  contactId: string
  contactName: string
}) {
  const [slots, setSlots] = useState<Record<IdUploadType, SlotState>>(INITIAL_SLOTS)
  const inputRefs: Record<IdUploadType, React.RefObject<HTMLInputElement | null>> = {
    front_of_id: useRef<HTMLInputElement>(null),
    back_of_id: useRef<HTMLInputElement>(null),
    selfie_with_id: useRef<HTMLInputElement>(null),
  }

  function handleFileSelect(type: IdUploadType, file: File | null) {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setSlots((prev) => ({ ...prev, [type]: { file, preview, status: 'idle', errorMsg: null } }))
  }

  async function uploadSlot(slot: SlotConfig) {
    const { file } = slots[slot.type]
    if (!file) return

    setSlots((prev) => ({
      ...prev,
      [slot.type]: { ...prev[slot.type], status: 'uploading' },
    }))

    const fd = new FormData()
    fd.append('type', slot.type)
    let fileToSend = file
    try {
      fileToSend = await compressImageForUpload(file)
    } catch (compressErr) {
      setSlots((prev) => ({
        ...prev,
        [slot.type]: {
          ...prev[slot.type],
          status: 'error',
          errorMsg: errorMessageFromUnknown(compressErr),
        },
      }))
      return
    }
    fd.append('file', fileToSend)

    try {
      const res = await fetch(`/api/contacts/${contactId}/upload`, { method: 'POST', body: fd })
      const raw = await res.text()
      const parsed = parseUploadResponse(res, raw)
      if (!parsed.ok) throw new Error(parsed.error)
      setSlots((prev) => ({
        ...prev,
        [slot.type]: { ...prev[slot.type], status: 'done' },
      }))
    } catch (err) {
      setSlots((prev) => ({
        ...prev,
        [slot.type]: {
          ...prev[slot.type],
          status: 'error',
          errorMsg: errorMessageFromUnknown(err),
        },
      }))
    }
  }

  async function handleUploadAll() {
    const pending = SLOTS.filter((s) => slots[s.type].file && slots[s.type].status === 'idle')
    await Promise.allSettled(pending.map(uploadSlot))
  }

  const allDone = SLOTS.every((s) => slots[s.type].status === 'done')
  const anyPending = SLOTS.some((s) => slots[s.type].file && slots[s.type].status === 'idle')
  const anyUploading = SLOTS.some((s) => slots[s.type].status === 'uploading')

  if (allDone) {
    return <SuccessScreen contactName={contactName} />
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="px-5 pt-10 pb-6 text-center">
        <h1 className="text-xl font-semibold">ID Verification</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Hi {contactName}, please upload your identification documents below.
        </p>
      </header>

      <div className="flex-1 space-y-3 px-5 pb-4">
        {SLOTS.map((slot) => {
          const state = slots[slot.type]
          const isDone = state.status === 'done'
          const isUploading = state.status === 'uploading'
          const isError = state.status === 'error'
          const hasFile = !!state.file

          return (
            <div key={slot.type}>
              <button
                type="button"
                onClick={() => !isDone && !isUploading && inputRefs[slot.type].current?.click()}
                disabled={isDone || isUploading}
                className={[
                  'w-full rounded-xl border-2 p-4 text-left transition-colors',
                  isDone
                    ? 'border-green-500 bg-green-50'
                    : hasFile
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-border bg-card hover:border-blue-400 hover:bg-blue-50/30',
                  isUploading ? 'cursor-not-allowed opacity-70' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  {/* Thumbnail or icon */}
                  <div className="shrink-0">
                    {state.preview && !isDone ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={state.preview}
                        alt={slot.label}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className={[
                          'flex h-14 w-14 items-center justify-center rounded-lg',
                          isDone ? 'bg-green-100' : 'bg-muted',
                        ].join(' ')}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-7 w-7 text-green-600" />
                        ) : isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        ) : (
                          <slot.Icon className="text-muted-foreground h-6 w-6" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Label + hint + status */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{slot.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{slot.hint}</p>
                    {isError && state.errorMsg && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {state.errorMsg}
                      </p>
                    )}
                    {isDone && <p className="mt-1 text-xs font-medium text-green-600">Uploaded</p>}
                    {isUploading && (
                      <p className="text-muted-foreground mt-1 text-xs">Uploading…</p>
                    )}
                    {!hasFile && !isDone && (
                      <p className="mt-1 text-xs text-blue-600">
                        Tap to open camera or choose file
                      </p>
                    )}
                    {hasFile && state.status === 'idle' && (
                      <p className="mt-1 text-xs text-blue-600">
                        Ready to upload — tap again to change
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {/* Hidden file input — one per slot */}
              <input
                ref={inputRefs[slot.type]}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture={slot.capture}
                className="hidden"
                onChange={(e) => handleFileSelect(slot.type, e.target.files?.[0] ?? null)}
              />
            </div>
          )
        })}
      </div>

      {/* Sticky upload button */}
      <div className="bg-background/90 sticky bottom-0 border-t px-5 pt-3 pb-8 backdrop-blur">
        <Button
          className="w-full"
          size="lg"
          disabled={!anyPending || anyUploading}
          onClick={handleUploadAll}
        >
          {anyUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </>
          )}
        </Button>

        {/* Show retry hint if any slot errored */}
        {SLOTS.some((s) => slots[s.type].status === 'error') && (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Some uploads failed. Fix the errors above and try again.
          </p>
        )}
      </div>
    </div>
  )
}
