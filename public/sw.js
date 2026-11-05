// The service worker: a small helper the browser runs alongside the app.
// It keeps a copy of the app's files on the phone, so the app opens instantly
// and works with no connection. It only stores the app itself. Your
// restaurants live in localStorage and never pass through here.

const CACHE = 'picker-files'
const APP_PAGE = './'

// Saves the app's page and every file it links to.
async function saveApp() {
  const cache = await caches.open(CACHE)
  const response = await fetch(APP_PAGE, { cache: 'no-cache' })
  if (!response.ok) return
  const html = await response.clone().text()
  await cache.put(APP_PAGE, response)

  const links = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
  await Promise.allSettled(links.map((link) => cache.add(link)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(saveApp())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Leave anything from other sites alone, like the address lookup.
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  if (request.mode === 'navigate') {
    // Opening the app: show the saved copy right away, and fetch the newest
    // version in the background for next time.
    event.respondWith(
      caches.match(APP_PAGE).then((saved) => {
        const update = saveApp().catch(() => {})
        if (saved) {
          event.waitUntil(update)
          return saved
        }
        return fetch(request)
      }),
    )
    return
  }

  // Everything else: use the saved copy if there is one. Built file names
  // change whenever their contents do, so a saved copy is never out of date.
  // (ignoreVary: match by address alone, since servers can label a file in
  // ways that would otherwise hide a saved copy.)
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((saved) => saved ?? fetch(request)),
  )
})
