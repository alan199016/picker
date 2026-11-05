// All of the app's data lives in one object, saved in the browser's
// localStorage under a single key. localStorage only holds text, so we
// turn the object into JSON text when saving and back when loading.

const STORAGE_KEY = 'restaurant-picker-v1'

const EMPTY_DATA = { restaurants: [], visits: [] }

export function loadData() {
  let saved
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY_DATA // Storage is blocked, so nothing can be read or overwritten.
  }
  if (!saved) return EMPTY_DATA

  try {
    const data = { ...EMPTY_DATA, ...JSON.parse(saved) }
    if (!Array.isArray(data.restaurants) || !Array.isArray(data.visits)) {
      throw new Error('Saved data has the wrong shape')
    }
    return data
  } catch {
    // We can't read it, and the app is about to save an empty list over it.
    // Set the text aside first, so it isn't lost.
    keepUnreadable(saved)
    return EMPTY_DATA
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// A unique id for each new record, so we can find it again later.
export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// Today's date as "2026-11-02", in the phone's own time zone.
export function today() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// The last filters you used, kept separately from your restaurants since
// they're a preference, not part of your data (and not part of a backup).
const FILTERS_KEY = 'restaurant-picker-filters'

export function loadFilters(fallback) {
  try {
    const saved = localStorage.getItem(FILTERS_KEY)
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback
  } catch {
    return fallback
  }
}

export function saveFilters(filters) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
}

// Saved text the app couldn't read, kept so it can still be saved to a file.
const UNREADABLE_KEY = 'restaurant-picker-unreadable'

function keepUnreadable(text) {
  try {
    localStorage.setItem(UNREADABLE_KEY, text)
  } catch {
    // Nowhere to put it. The app carries on with an empty list.
  }
}

export function loadUnreadable() {
  try {
    return localStorage.getItem(UNREADABLE_KEY)
  } catch {
    return null
  }
}

// The date of the last export from this device, e.g. "2026-11-04", or null.
const LAST_BACKUP_KEY = 'restaurant-picker-last-backup'

export function loadLastBackup() {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

export function saveLastBackup(date) {
  localStorage.setItem(LAST_BACKUP_KEY, date)
}

// Asks the browser not to clear this app's data when the device runs low on
// space. The browser may say no, and the app works the same either way.
export function askToKeepStorage() {
  navigator.storage?.persist?.().catch(() => {})
}
