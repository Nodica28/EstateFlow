/**
 * Downscale/re-encode images so multipart uploads stay under Vercel's serverless
 * body limit (~4.5 MB). Our API allows larger files, but the platform rejects them first.
 */
const VERCEL_SAFE_MAX_BYTES = 3_200_000

function scaleToMaxEdge(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not compress image'))),
      'image/jpeg',
      quality
    )
  })
}

export async function compressImageForUpload(
  file: File,
  maxBytes: number = VERCEL_SAFE_MAX_BYTES
): Promise<File> {
  if (file.size <= maxBytes) return file

  const baseName = file.name.replace(/\.[^.]+$/u, '') || 'id-photo'

  let maxEdge = 2560
  let quality = 0.9

  for (let attempt = 0; attempt < 22; attempt++) {
    const bitmap = await createImageBitmap(file)
    try {
      const { width, height } = scaleToMaxEdge(bitmap.width, bitmap.height, maxEdge)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not compress image')
      ctx.drawImage(bitmap, 0, 0, width, height)
      const blob = await canvasToJpegBlob(canvas, quality)
      if (blob.size <= maxBytes) {
        return new File([blob], `${baseName}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
      }
    } finally {
      bitmap.close()
    }

    quality -= 0.06
    if (quality < 0.42) {
      quality = 0.88
      maxEdge = Math.round(maxEdge * 0.82)
    }
    if (maxEdge < 720) {
      throw new Error(
        'This photo is too large to upload from your phone. Try taking the picture again in better light, or pick an existing photo from your library.'
      )
    }
  }

  throw new Error(
    'Could not shrink the photo enough to upload. Try a smaller image or one taken at a lower resolution.'
  )
}
