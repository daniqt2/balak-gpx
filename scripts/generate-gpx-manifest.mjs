import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const gpxDir = join(__dir, '..', 'public', 'gpx')

if (!existsSync(gpxDir)) mkdirSync(gpxDir, { recursive: true })

const files = readdirSync(gpxDir)
  .filter((f) => f.toLowerCase().endsWith('.gpx'))
  .sort()
  .map((file) => ({
    file,
    name: file
      .replace(/\.gpx$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }))

writeFileSync(join(gpxDir, 'index.json'), JSON.stringify(files, null, 2))
console.log(`GPX manifest: ${files.length} route(s)`)
