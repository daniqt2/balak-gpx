export const MAX_GPX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_GPX_TRACK_POINTS = 20_000

type Translate = (key: string, vars?: Record<string, string>) => string

export function ensureGpxFileSize(file: File, t: Translate) {
  if (file.size > MAX_GPX_FILE_BYTES) {
    throw new Error(
      t('upload.error_too_large', {
        maxMb: formatMegabytes(MAX_GPX_FILE_BYTES),
      })
    )
  }
}

export function ensureGpxTrackPointLimit(text: string, t: Translate) {
  const trackPointCount = countTrackPoints(text)
  if (trackPointCount > MAX_GPX_TRACK_POINTS) {
    throw new Error(
      t('upload.error_too_many_points', {
        maxPoints: MAX_GPX_TRACK_POINTS.toLocaleString('en-US'),
      })
    )
  }
}

function countTrackPoints(text: string) {
  const matches = text.match(/<trkpt\b/gi)
  return matches ? matches.length : 0
}

function formatMegabytes(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(0)
}
