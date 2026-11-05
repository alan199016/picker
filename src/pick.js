// The picking logic, kept apart from the screens so it's easy to read and test.

const DAY_MS = 24 * 60 * 60 * 1000

// Whole days between a "2026-11-02" style date and today.
export function daysSince(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((todayMidnight - then) / DAY_MS)
}

// The most recent visit to this restaurant, or null if there are none.
export function lastVisitDate(restaurant, visits) {
  const dates = visits.filter((v) => v.restaurantId === restaurant.id).map((v) => v.date)
  if (dates.length === 0) return null
  // "YYYY-MM-DD" text sorts the same way as the dates themselves.
  return dates.sort().at(-1)
}

// How likely a restaurant is to be picked. A place never visited counts from
// the day it was added. Days are capped at 365 (anything a year old or more is
// equally likely) and floored at 1 (a place visited today can still come up,
// just rarely). The square root makes the curve gentle: 300 days is about
// 3x as likely as 30 days, not 10x.
export function weight(restaurant, visits) {
  const baseline = lastVisitDate(restaurant, visits) ?? restaurant.dateAdded
  const days = Math.min(365, Math.max(1, daysSince(baseline)))
  return Math.sqrt(days)
}

// Picks one restaurant at random, weighted as above, skipping any whose id is
// in `seenIds`. Once everything has been seen, all of them are back in play.
export function pickRestaurant(restaurants, visits, seenIds) {
  if (restaurants.length === 0) return null

  let pool = restaurants.filter((r) => !seenIds.includes(r.id))
  if (pool.length === 0) pool = restaurants

  // Picture each restaurant as a slice of a line, as long as its weight.
  // Throw a dart at a random spot on the line and see whose slice it hits.
  const weights = pool.map((r) => weight(r, visits))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let dart = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    dart -= weights[i]
    if (dart < 0) return pool[i]
  }
  return pool.at(-1) // only reached through rounding error
}

// "today", "3 days ago", "8 months ago"…
export function timeAgo(dateString) {
  const days = daysSince(dateString)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.round(days / 7)} weeks ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  const years = Math.round(days / 365)
  return years === 1 ? 'a year ago' : `${years} years ago`
}

// A Google Maps link for the restaurant: opens the Google Maps app on the
// phone if it's installed, otherwise Google Maps in the browser.
export function mapsLink(restaurant) {
  const query = [restaurant.name, restaurant.address].filter(Boolean).join(', ')
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query)
}
