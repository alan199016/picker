import { today } from './storage.js'

// The backup file: your restaurants and visits as JSON text, plus a label
// saying what the file is, so Import can refuse anything else.

const APP_NAME = 'restaurant-picker'
const BACKUP_VERSION = 1

export function backupFileName() {
  return `restaurant-picker-backup-${today()}.json`
}

export function makeBackup(data) {
  return JSON.stringify(
    {
      app: APP_NAME,
      version: BACKUP_VERSION,
      exportedOn: today(),
      restaurants: data.restaurants,
      visits: data.visits,
    },
    null,
    2,
  )
}

function isValidRestaurant(r) {
  return (
    typeof r?.id === 'string' &&
    typeof r.name === 'string' &&
    r.name !== '' &&
    Array.isArray(r.cuisines) &&
    [1, 2, 3, 4].includes(r.price) &&
    typeof r.dateAdded === 'string'
  )
}

function isValidVisit(v, restaurantIds) {
  return (
    typeof v?.id === 'string' &&
    restaurantIds.includes(v.restaurantId) &&
    typeof v.date === 'string' &&
    ['unconfirmed', 'confirmed'].includes(v.status)
  )
}

// Reads a backup file's text. Checks everything before anything gets
// replaced, and throws an error with a plain message if the file is no good.
export function readBackup(text) {
  let backup
  try {
    backup = JSON.parse(text)
  } catch {
    throw new Error("This doesn't look like a backup file.")
  }

  if (backup?.app !== APP_NAME) throw new Error("This doesn't look like a backup file.")
  if (backup.version !== BACKUP_VERSION) {
    throw new Error('This backup came from a different version of the app.')
  }

  const { restaurants, visits } = backup
  const ids = Array.isArray(restaurants) ? restaurants.map((r) => r?.id) : []
  if (
    !Array.isArray(restaurants) ||
    !Array.isArray(visits) ||
    !restaurants.every(isValidRestaurant) ||
    !visits.every((v) => isValidVisit(v, ids))
  ) {
    throw new Error('This backup file is damaged, so nothing was changed.')
  }

  return { restaurants, visits }
}

// Saves text as a file. On a phone this opens the share sheet, which has
// "Save to Files". Elsewhere it's an ordinary download. Returns false if you
// cancelled the share sheet.
export async function saveFile(text, fileName) {
  const file = new File([text], fileName, { type: 'application/json' })

  const isTouchDevice = navigator.maxTouchPoints > 0
  if (isTouchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return true
    } catch (error) {
      if (error.name === 'AbortError') return false
      // Sharing failed for another reason: fall through to a download.
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
  return true
}
