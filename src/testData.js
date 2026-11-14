// 20 made-up restaurants for trying the app on your Mac. Only the test
// version shows the button that loads them; the published app leaves this
// file out entirely.

// Places are positioned around central Costa Mesa.
const CENTER = { lat: 33.6412, lng: -117.9187 }

// [name, cuisines, price, miles north, miles east (null = no address),
//  last visit in days ago (null = never), want-to-go flagged days ago, notes]
const ROWS = [
  ['Saffron Table', ['Indian'], 2, 1, 1, 12, null, 'Garlic naan'],
  ['Little Lisbon', ['Portuguese'], 3, 2, -1, 45, null, ''],
  ['Noodle Theory', ['Japanese', 'Ramen'], 2, 1, -2, 3, null, 'Spicy miso'],
  ['Casa Paloma', ['Mexican'], 1, 3, 2, 200, null, 'Birria tacos'],
  ['The Copper Pan', ['American'], 2, 4, 1, 400, null, ''],
  ['Olive & Thyme', ['Mediterranean'], 3, -3, 2, 90, null, 'Lamb plate'],
  ['Seoul Kitchen', ['Korean'], 2, 6, 4, 30, null, ''],
  ['Pho Lantern', ['Vietnamese'], 1, 8, 3, 7, null, 'Pho tai'],
  ['Trattoria Bella', ['Italian'], 3, 7, -5, 600, null, 'Cacio e pepe'],
  ['Golden Wok', ['Chinese'], 1, 9, 6, 150, null, ''],
  ['Bangkok Alley', ['Thai'], 2, -6, 7, 60, null, 'Pad see ew'],
  ['Harbor & Salt', ['Seafood'], 4, -4, -6, 800, null, 'Oysters'],
  ['Smoke & Oak', ['Barbecue', 'American'], 2, 12, 8, null, 40, ''],
  ['Bistro Lumière', ['French'], 4, 14, -7, null, 90, 'Book ahead'],
  ['Sushi Komorebi', ['Japanese', 'Sushi'], 4, 16, 6, null, null, 'Omakase'],
  ['Tacos del Sol', ['Mexican'], 1, 18, 11, 500, null, ''],
  ['Green Ladle', ['Vegetarian'], 2, 13, 12, 25, null, ''],
  ['Ember Pizza', ['Italian', 'Pizza'], 2, 25, 10, 100, null, 'Margherita'],
  ['Mumbai Street', ['Indian'], 1, null, null, null, null, 'No address, tests the distance filter'],
  ['Corner Bakery Cafe', ['Bakery', 'Cafe'], 1, null, null, 2, null, ''],
]

// A date some days before today, as "2026-11-13".
function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// Adds the test restaurants to `data`. Test records have ids starting with
// "test-", so loading again replaces them instead of adding duplicates, and
// anything you added yourself is left alone.
export function addTestData(data) {
  const restaurants = data.restaurants.filter((r) => !r.id.startsWith('test-'))
  const visits = data.visits.filter((v) => !v.restaurantId.startsWith('test-'))

  ROWS.forEach(([name, cuisines, price, north, east, lastVisit, flagged, notes], i) => {
    const id = `test-${i + 1}`
    const hasAddress = north !== null
    restaurants.push({
      id,
      name,
      cuisines,
      price,
      address: hasAddress ? `${100 + i * 37} Test Street, Costa Mesa, CA` : '',
      // About 69 miles per degree of latitude; 57.5 per degree of longitude here.
      location: hasAddress
        ? { lat: CENTER.lat + north / 69, lng: CENTER.lng + east / 57.5, label: 'Test location' }
        : null,
      notes,
      dateAdded: daysAgo(flagged ? Math.max(flagged, 10) : 900),
      wantToGo: flagged ? { since: daysAgo(flagged), notNowAt: null } : null,
    })
    if (lastVisit !== null) {
      visits.push({
        id: `test-v${i + 1}`,
        restaurantId: id,
        date: daysAgo(lastVisit),
        status: 'confirmed',
        createdAt: Date.now() - lastVisit * 24 * 60 * 60 * 1000,
      })
    }
  })

  return { restaurants, visits }
}
