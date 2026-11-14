import { useEffect, useRef } from 'react'

// The launch prompts: the questions the app may ask when it's opened, in
// this order, each skipped when it doesn't apply:
//   1. "Did you end up going to X?"  (a Go here not yet confirmed)
//   2. "You wanted to try X."        (a want-to-go flag)

const HOUR_MS = 60 * 60 * 1000

// After "Not now", want-to-go prompts stay quiet this long.
const WANT_TO_GO_QUIET_MS = 24 * HOUR_MS

// Being away from the app this long counts as opening it again.
const AWAY_COUNTS_AS_REOPEN_MS = HOUR_MS

// Which prompt to show right now, or null for none. `skipIds` are
// restaurants already asked about during this launch.
export function chooseLaunchPrompt(data, skipIds = [], now = Date.now()) {
  // 1. A Go here from at least an hour ago that hasn't been confirmed.
  const pending = data.visits.find(
    (v) => v.status === 'unconfirmed' && now - v.createdAt >= AWAY_COUNTS_AS_REOPEN_MS,
  )
  if (pending) return { type: 'did-you-go', restaurantId: pending.restaurantId, visitId: pending.id }

  // 2. A want-to-go place. Skip places with a Go here waiting for an
  // answer: you've already made a plan to go there.
  const planned = data.visits.filter((v) => v.status === 'unconfirmed').map((v) => v.restaurantId)
  const flagged = data.restaurants.filter(
    (r) => r.wantToGo && !planned.includes(r.id) && !skipIds.includes(r.id),
  )
  if (flagged.length === 0) return null

  // Stay quiet for a day after the most recent "Not now".
  const lastNotNow = Math.max(...flagged.map((r) => r.wantToGo.notNowAt ?? 0))
  if (now - lastNotNow < WANT_TO_GO_QUIET_MS) return null

  // Places never dismissed come first, oldest flag first. Then the ones
  // dismissed longest ago, so a single "Not now" place doesn't block the rest.
  const next = [...flagged].sort(
    (a, b) =>
      (a.wantToGo.notNowAt ?? 0) - (b.wantToGo.notNowAt ?? 0) ||
      a.wantToGo.since.localeCompare(b.wantToGo.since),
  )[0]
  return { type: 'want-to-go', restaurantId: next.id }
}

// Calls `onReopen` when you come back to the app after an hour or more away.
// On iPhone a home-screen app usually just resumes instead of starting
// fresh, so this is how the app notices it's been "opened" again.
export function useReopenAfterAway(onReopen) {
  // Always call the newest version of onReopen, which sees the newest data.
  const latestOnReopen = useRef(onReopen)
  useEffect(() => {
    latestOnReopen.current = onReopen
  })

  useEffect(() => {
    let hiddenAt = null
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt >= AWAY_COUNTS_AS_REOPEN_MS) latestOnReopen.current()
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
