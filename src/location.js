// Asks the phone where it is. The first time, iPhone shows its
// "Allow location?" prompt. Browsers only allow this on secure (https)
// sites, plus localhost while developing.

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      reject(new Error('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error),
      // A rough fix is fine for "under 5 miles", and one from the last
      // 5 minutes is fine too: both make it faster.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
