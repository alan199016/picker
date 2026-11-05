// Filter rules: which restaurants are allowed into the pick.
// An empty choice means "any": no cuisines selected = every cuisine.

export const NO_FILTERS = { cuisines: [], prices: [], maxMiles: null }

// The distance choices. `null` means any distance.
export const DISTANCE_CHOICES = [5, 15, null]

export function isFiltered(filters) {
  return filters.cuisines.length > 0 || filters.prices.length > 0 || filters.maxMiles !== null
}

// Does this restaurant pass every filter? `here` is the phone's location,
// needed only when a distance limit is on.
export function passesFilters(restaurant, filters, here) {
  if (filters.cuisines.length > 0) {
    const wanted = filters.cuisines.map((c) => c.toLowerCase())
    const hasOne = restaurant.cuisines.some((c) => wanted.includes(c.toLowerCase()))
    if (!hasOne) return false
  }

  if (filters.prices.length > 0 && !filters.prices.includes(restaurant.price)) {
    return false
  }

  // Places with no known location always pass the distance filter, so they
  // never drop out of the pick just because their address wasn't found.
  if (filters.maxMiles !== null && restaurant.location && here) {
    if (distanceMiles(here, restaurant.location) > filters.maxMiles) return false
  }

  return true
}

// Straight-line ("as the crow flies") distance between two points on Earth,
// using the haversine formula. Driving distance will be a bit longer.
export function distanceMiles(a, b) {
  const EARTH_RADIUS_MILES = 3959
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}
