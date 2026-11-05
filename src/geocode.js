// Turns an address into map coordinates (latitude/longitude) using
// OpenStreetMap's free Nominatim service. Only called when you tap "Find",
// because the service asks for at most one lookup per second.

export async function lookUpAddress(address) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
    encodeURIComponent(address)
  const response = await fetch(url)
  if (!response.ok) throw new Error('Lookup failed')

  const results = await response.json()
  if (results.length === 0) return null

  const place = results[0]
  return {
    lat: Number(place.lat),
    lng: Number(place.lon),
    label: place.display_name,
  }
}
