'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, type Result } from '@zxing/library'
import { AlertCircle, CheckCircle2, Loader2, MapPin, ScanBarcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number | null }
  | { status: 'denied' }
  | { status: 'error'; message: string }

type CheckInApiJson = { success?: boolean; error?: string }

function parseCheckInResponse(
  res: Response,
  raw: string
): { ok: true } | { ok: false; error: string } {
  const text = raw.trim()
  if (!text) {
    return {
      ok: false,
      error: res.ok
        ? 'Empty server response. Please try again.'
        : `Check-in failed (${res.status}). Please try again.`,
    }
  }
  let body: CheckInApiJson
  try {
    body = JSON.parse(text) as CheckInApiJson
  } catch {
    return {
      ok: false,
      error: res.ok
        ? 'Unexpected server response. Please try again.'
        : `Check-in failed (${res.status}). Please try again.`,
    }
  }
  if (!res.ok) {
    return { ok: false, error: body.error ?? 'Check-in failed' }
  }
  if (!body.success) {
    return { ok: false, error: body.error ?? 'Check-in failed' }
  }
  return { ok: true }
}

/** Pull canonical lowercase UUID from scanner text (handles GS1 prefixes, spaces, etc.). */
function uuidFromScanText(raw: string): string | null {
  const trimmed = raw
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  const m = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (m) return m[0].toLowerCase()

  const hexOnly = trimmed.replace(/[^0-9a-f]/gi, '')
  if (/^[0-9a-f]{32}$/i.test(hexOnly)) {
    const h = hexOnly.toLowerCase()
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
  }
  return null
}

function SuccessScreen({ contactName }: { contactName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-xl font-semibold">You&apos;re checked in</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Thanks, {contactName}. Your arrival at the property has been recorded.
      </p>
    </div>
  )
}

export function TourCheckinClient({
  leasingOpportunityId,
  contactName,
  unitCheckInConfigured,
}: {
  leasingOpportunityId: string
  contactName: string
  unitCheckInConfigured: boolean
}) {
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' })
  const [scannerActive, setScannerActive] = useState(false)
  const [barcodeMatched, setBarcodeMatched] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [manualId, setManualId] = useState('')
  const [manualIdError, setManualIdError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const stopCameraTracks = useCallback(() => {
    const v = videoRef.current
    const stream = v?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (v) v.srcObject = null
  }, [])

  const stopScanner = useCallback(() => {
    scannerControlsRef.current?.stop()
    scannerControlsRef.current = null
    readerRef.current = null
    stopCameraTracks()
    setScannerActive(false)
  }, [stopCameraTracks])

  useEffect(() => {
    return () => {
      scannerControlsRef.current?.stop()
      scannerControlsRef.current = null
      readerRef.current = null
    }
  }, [])

  function requestLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ status: 'error', message: 'Location is not supported in this browser.' })
      return
    }
    setGeo({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: 'ok',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeo({ status: 'denied' })
        } else {
          setGeo({
            status: 'error',
            message: 'Could not read your location. Try again or move outdoors briefly.',
          })
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 }
    )
  }

  const verifyManualId = useCallback(
    (raw: string) => {
      setManualIdError(null)
      const expected = leasingOpportunityId.trim().toLowerCase()
      const decoded = uuidFromScanText(raw)
      if (!decoded) {
        setManualIdError('Enter a valid ID (the UUID from the barcode or unit label).')
        return
      }
      if (decoded !== expected) {
        setManualIdError("That ID doesn't match this tour.")
        return
      }
      setBarcodeMatched(true)
      setScannerError(null)
      stopScanner()
    },
    [leasingOpportunityId, stopScanner]
  )

  async function startScanner() {
    setScannerError(null)
    setManualIdError(null)
    const video = videoRef.current
    if (!video) {
      setScannerError('Camera preview is not ready.')
      return
    }

    const hints = new Map<DecodeHintType, unknown>()
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
    ])

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 50,
      tryPlayVideoTimeout: 15_000,
    })
    readerRef.current = reader
    setScannerActive(true)

    const expected = leasingOpportunityId.trim().toLowerCase()

    const onDecode = (result: Result | undefined) => {
      if (!result) return
      const decoded = uuidFromScanText(result.getText())
      if (decoded === expected) {
        setBarcodeMatched(true)
        setScannerError(null)
        scannerControlsRef.current?.stop()
        scannerControlsRef.current = null
        readerRef.current = null
        stopCameraTracks()
        setScannerActive(false)
      }
    }

    const videoConstraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
    }

    try {
      const controls = await reader.decodeFromConstraints(videoConstraints, video, onDecode)
      scannerControlsRef.current = controls
    } catch {
      try {
        const controls = await reader.decodeFromVideoDevice(undefined, video, onDecode)
        scannerControlsRef.current = controls
      } catch (e) {
        readerRef.current = null
        setScannerActive(false)
        setScannerError(
          e instanceof Error ? e.message : 'Could not start the camera. Check browser permissions.'
        )
      }
    }
  }

  async function completeCheckIn() {
    if (geo.status !== 'ok') return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/leasing-opportunities/${leasingOpportunityId}/tour-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: geo.lat,
          longitude: geo.lng,
          accuracyMeters: geo.accuracy,
        }),
      })
      const raw = await res.text()
      const parsed = parseCheckInResponse(res, raw)
      if (!parsed.ok) {
        setSubmitError(parsed.error)
        return
      }
      setDone(true)
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!unitCheckInConfigured) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-8 w-8 text-amber-700" />
        </div>
        <h1 className="text-xl font-semibold">Tour check-in unavailable</h1>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          This tour isn&apos;t set up for check-in yet. Please contact the leasing office for help.
        </p>
      </div>
    )
  }

  if (done) {
    return <SuccessScreen contactName={contactName} />
  }

  const canComplete = geo.status === 'ok' && barcodeMatched && !submitting && !scannerActive

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="px-5 pt-10 pb-6 text-center">
        <h1 className="text-xl font-semibold">Tour check-in</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Hi {contactName}, confirm you&apos;re at the property by sharing your location and
          verifying the unit barcode—or enter the ID manually if the camera does not work.
        </p>
      </header>

      <div className="flex-1 space-y-4 px-5 pb-4">
        {/* Location */}
        <div className="border-border bg-card rounded-xl border-2 p-4">
          <div className="flex items-start gap-3">
            <div
              className={
                geo.status === 'ok'
                  ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100'
                  : 'bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'
              }
            >
              {geo.status === 'loading' ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              ) : geo.status === 'ok' ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <MapPin className="text-muted-foreground h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Location</p>
              {geo.status === 'idle' && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Tap below so we can verify you&apos;re at the building. Your exact coordinates are
                  not shown on this screen.
                </p>
              )}
              {geo.status === 'loading' && (
                <p className="text-muted-foreground mt-0.5 text-xs">Getting location…</p>
              )}
              {geo.status === 'ok' && (
                <p className="mt-0.5 text-xs font-medium text-green-600">Location captured</p>
              )}
              {geo.status === 'denied' && (
                <p className="mt-1 text-xs text-amber-800">
                  Location access was blocked. Use the prompt in your browser to allow location for
                  this site, then try again here — you don&apos;t need to open system settings.
                </p>
              )}
              {geo.status === 'error' && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {geo.message}
                </p>
              )}
            </div>
          </div>
          {geo.status === 'idle' && (
            <Button type="button" className="mt-4 w-full" size="sm" onClick={requestLocation}>
              Share location
            </Button>
          )}
          {(geo.status === 'denied' || geo.status === 'error') && (
            <Button
              type="button"
              className="mt-4 w-full"
              size="sm"
              variant="outline"
              onClick={requestLocation}
            >
              Try again
            </Button>
          )}
        </div>

        {/* Barcode */}
        <div className="border-border bg-card rounded-xl border-2 p-4">
          <div className="flex items-start gap-3">
            <div
              className={
                barcodeMatched
                  ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100'
                  : 'bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'
              }
            >
              {barcodeMatched ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <ScanBarcode className="text-muted-foreground h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Unit barcode</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Point your camera at the barcode (Code 128 or QR). Hold steady in good light; use
                the rear camera if asked. If scanning fails, paste or type the unit ID below.
              </p>
              {barcodeMatched && (
                <p className="mt-1 text-xs font-medium text-green-600">Barcode verified</p>
              )}
            </div>
          </div>
          {!barcodeMatched && (
            <div className="mt-4 w-full">
              <video
                ref={videoRef}
                className="block min-h-[220px] w-full max-w-none rounded-lg bg-black object-cover sm:min-h-[280px]"
                muted
                playsInline
                autoPlay
              />
              {!scannerActive ? (
                <Button type="button" className="mt-3 w-full" size="sm" onClick={startScanner}>
                  Start camera & scan
                </Button>
              ) : (
                <Button
                  type="button"
                  className="mt-3 w-full"
                  size="sm"
                  variant="outline"
                  onClick={stopScanner}
                >
                  Stop camera
                </Button>
              )}
              {scannerError && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {scannerError}
                </p>
              )}
              <form
                className="mt-4 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const data = new FormData(e.currentTarget)
                  verifyManualId(String(data.get('manualId') ?? ''))
                }}
              >
                <p className="text-muted-foreground text-xs font-medium">Enter ID manually</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input
                    name="manualId"
                    value={manualId}
                    onChange={(e) => {
                      setManualId(e.target.value)
                      if (manualIdError) setManualIdError(null)
                    }}
                    placeholder="Paste or type the unit ID (UUID)"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={manualIdError ? true : undefined}
                    className="sm:flex-1"
                  />
                  <Button type="submit" className="sm:w-auto" size="sm" variant="secondary">
                    Verify ID
                  </Button>
                </div>
                {manualIdError && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {manualIdError}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>

        {submitError && (
          <p className="flex items-center gap-1 text-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {submitError}
          </p>
        )}
      </div>

      <div className="bg-background/90 sticky bottom-0 border-t px-5 pt-3 pb-8 backdrop-blur">
        <Button className="w-full" size="lg" disabled={!canComplete} onClick={completeCheckIn}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking in…
            </>
          ) : (
            'Complete check-in'
          )}
        </Button>
        {(geo.status !== 'ok' || !barcodeMatched) && (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Share your location and verify the unit (scan or enter the ID) to enable check-in.
          </p>
        )}
      </div>
    </div>
  )
}
