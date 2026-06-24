import type { SupabaseClient } from '@supabase/supabase-js'

/** Matches DB values like `storage/contacts-licenses/license-1.png`. */
const STORAGE_PREFIX = /^storage\/([^/]+)\/(.+)$/i

export function parseDriversLicenseStoragePath(path: string | null): {
  bucket: string
  objectPath: string
} | null {
  if (!path?.trim()) return null
  const m = path.trim().match(STORAGE_PREFIX)
  if (!m) return null
  return { bucket: m[1], objectPath: m[2] }
}

/** Sync URL; only works when the bucket is public. */
export function publicUrlForDriversLicensePath(
  supabase: SupabaseClient,
  path: string | null
): string | null {
  const p = parseDriversLicenseStoragePath(path)
  if (!p) return null
  return supabase.storage.from(p.bucket).getPublicUrl(p.objectPath).data.publicUrl
}

/**
 * URL for displaying a license in the browser. Uses a signed URL so private buckets work
 * for authenticated users; falls back to public URL if signing fails.
 */
export async function resolveDriversLicenseViewUrl(
  supabase: SupabaseClient,
  path: string | null,
  expiresIn = 3600
): Promise<string | null> {
  const p = parseDriversLicenseStoragePath(path)
  if (!p) return null

  const { bucket, objectPath } = p
  const signed = await supabase.storage.from(bucket).createSignedUrl(objectPath, expiresIn)

  if (signed.data?.signedUrl && !signed.error) {
    return signed.data.signedUrl
  }

  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl
}
