import { useEffect, useState } from 'react'
import { loadData, loadFilters, newId, saveData, saveFilters, today } from './storage.js'
import RestaurantList from './RestaurantList.jsx'
import RestaurantForm from './RestaurantForm.jsx'
import Home from './Home.jsx'
import RestaurantDetail from './RestaurantDetail.jsx'
import LaunchPrompt from './LaunchPrompt.jsx'
import Backup from './Backup.jsx'
import { addTestData } from './testData.js'
import { chooseLaunchPrompt, useReopenAfterAway } from './launch.js'
import { pickRestaurant } from './pick.js'
import { NO_FILTERS, passesFilters } from './filters.js'
import { getCurrentLocation } from './location.js'

export default function App() {
  // `data` holds every restaurant and visit. It starts from what's saved on
  // the phone, and is saved again every time it changes.
  const [data, setData] = useState(loadData)
  useEffect(() => saveData(data), [data])

  // Which tab is showing: 'home' or 'list'.
  const [tab, setTab] = useState('home')

  // Which restaurant's detail page is open in the list tab, if any.
  const [viewingId, setViewingId] = useState(null)

  // Whether the Backup screen is open in the list tab.
  const [showBackup, setShowBackup] = useState(false)

  // Which restaurant is open in the form: null (form closed),
  // 'new' (adding one), or the id of the restaurant being edited.
  const [editingId, setEditingId] = useState(null)

  // The launch prompt on screen, if any. Chosen when the app starts, and
  // again when you come back after an hour or more away. `askedIds` are the
  // places already asked about in this launch, so none comes up twice.
  const [prompt, setPrompt] = useState(() => chooseLaunchPrompt(data))
  const [askedIds, setAskedIds] = useState([])
  useReopenAfterAway(() => {
    setAskedIds([])
    setPrompt(chooseLaunchPrompt(data))
  })

  // The restaurant on the result card, and every restaurant shown since the
  // app opened, so "Pick another" doesn't repeat one until all have come up.
  // These aren't saved, so reopening the app starts fresh.
  const [pickedId, setPickedId] = useState(null)
  const [seenIds, setSeenIds] = useState([])

  // Set to the result card's restaurant once you tap Go here on it.
  const [wentId, setWentId] = useState(null)

  // The filters, saved so they're still set next time you open the app.
  const [filters, setFilters] = useState(() => loadFilters(NO_FILTERS))
  useEffect(() => saveFilters(filters), [filters])

  function changeFilters(newFilters) {
    setFilters(newFilters)
    // New filters, new set of places: clear the card and start rerolls over.
    setPickedId(null)
    setSeenIds([])
    setWentId(null)
  }

  // The phone's location, needed only for the distance filter.
  // locationAnswer is what the phone last said: null (no answer yet),
  // 'ready', 'denied' or 'unavailable'.
  const [here, setHere] = useState(null)
  const [locationAnswer, setLocationAnswer] = useState(null)
  const wantsDistance = filters.maxMiles !== null
  const locationStatus = locationAnswer ?? 'locating'

  // Whenever a distance limit gets switched on (or the app opens with one
  // on), ask the phone where it is.
  useEffect(() => {
    if (!wantsDistance) return
    let stillWanted = true
    getCurrentLocation()
      .then((position) => {
        if (!stillWanted) return
        setHere(position)
        setLocationAnswer('ready')
      })
      .catch((error) => {
        if (!stillWanted) return
        setLocationAnswer(error.code === 1 ? 'denied' : 'unavailable')
      })
    // If the distance filter is switched off before the answer arrives,
    // ignore the answer.
    return () => {
      stillWanted = false
    }
  }, [wantsDistance])

  // The restaurants that pass the filters right now. Picking waits until we
  // know where you are, if a distance limit is on.
  const matches = data.restaurants.filter((r) => passesFilters(r, filters, here))
  const canPick = !wantsDistance || locationStatus === 'ready'

  function pickForUs() {
    setWentId(null)
    const all = matches // only the places that pass the filters
    const roundIsOver = all.every((r) => seenIds.includes(r.id))
    if (roundIsOver) {
      // Everything has been shown: start a new round. Skip only the place on
      // screen now, so the same one doesn't come up twice in a row.
      const choice = pickRestaurant(all, data.visits, pickedId ? [pickedId] : [])
      setPickedId(choice.id)
      setSeenIds([choice.id])
    } else {
      const choice = pickRestaurant(all, data.visits, seenIds)
      setPickedId(choice.id)
      setSeenIds([...seenIds, choice.id])
    }
  }

  // Changes some fields of one restaurant and leaves the rest as they were.
  function updateRestaurant(id, changes) {
    setData((current) => ({
      ...current,
      restaurants: current.restaurants.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    }))
  }

  function toggleWantToGo(restaurant) {
    updateRestaurant(restaurant.id, {
      wantToGo: restaurant.wantToGo ? null : { since: today(), notNowAt: null },
    })
  }

  // --- Visits ---

  // Go here: save a visit dated today, unconfirmed until the next launch
  // asks "Did you end up going?". Only one plan at a time, so it replaces
  // any earlier unconfirmed visit.
  function planVisit(current, restaurantId) {
    const visit = {
      id: newId(),
      restaurantId,
      date: today(),
      status: 'unconfirmed',
      createdAt: Date.now(),
    }
    return { ...current, visits: [...current.visits.filter((v) => v.status !== 'unconfirmed'), visit] }
  }

  // Marks a visit confirmed and clears that place's want-to-go flag.
  function confirmVisit(current, visitId) {
    const visit = current.visits.find((v) => v.id === visitId)
    return {
      visits: current.visits.map((v) => (v.id === visitId ? { ...v, status: 'confirmed' } : v)),
      restaurants: current.restaurants.map((r) =>
        r.id === visit.restaurantId ? { ...r, wantToGo: null } : r,
      ),
    }
  }

  function removeVisit(current, visitId) {
    return { ...current, visits: current.visits.filter((v) => v.id !== visitId) }
  }

  // Go here on the result card.
  function goHere(restaurant) {
    setData((current) => planVisit(current, restaurant.id))
    setWentId(restaurant.id)
  }

  // Undo right after Go here, if you change your mind.
  function undoGoHere() {
    setData((current) => ({
      ...current,
      visits: current.visits.filter((v) => !(v.status === 'unconfirmed' && v.restaurantId === wentId)),
    }))
    setWentId(null)
  }

  // We went here, on the detail page: a confirmed visit dated today. If a
  // Go here for this place was waiting, it becomes this visit.
  function weWentHere(restaurant) {
    setData((current) => {
      const planned = current.visits.find(
        (v) => v.status === 'unconfirmed' && v.restaurantId === restaurant.id,
      )
      const withVisit = planned ? current : planVisit(current, restaurant.id)
      const visit = withVisit.visits.find(
        (v) => v.status === 'unconfirmed' && v.restaurantId === restaurant.id,
      )
      return confirmVisit(withVisit, visit.id)
    })
  }

  // Import: the file's list replaces the current one. Clear anything on
  // screen that pointed at the old list.
  function importBackup(backup) {
    setData(backup)
    setPickedId(null)
    setSeenIds([])
    setWentId(null)
    setViewingId(null)
  }

  // --- Launch prompts ---

  // Saves the answer's changes, then moves on to the next prompt (if any).
  function answerPrompt(newData) {
    const asked = [...askedIds, prompt.restaurantId]
    setData(newData)
    setAskedIds(asked)
    setPrompt(chooseLaunchPrompt(newData, asked))
  }

  function answerYes() {
    if (prompt.type === 'did-you-go') {
      answerPrompt(confirmVisit(data, prompt.visitId))
    } else {
      // Go here on "You wanted to try X": save the visit, show its card,
      // and end the prompts for this launch.
      setData(planVisit(data, prompt.restaurantId))
      setPrompt(null)
      setTab('home')
      setPickedId(prompt.restaurantId)
      setSeenIds([prompt.restaurantId])
      setWentId(prompt.restaurantId)
    }
  }

  function answerNo() {
    if (prompt.type === 'did-you-go') {
      // Removing the visit brings back the previous last-visit date.
      answerPrompt(removeVisit(data, prompt.visitId))
    } else {
      // Not now: remember when, so the app stays quiet for a day and the next
      // prompt moves on to a different place.
      answerPrompt({
        ...data,
        restaurants: data.restaurants.map((r) =>
          r.id === prompt.restaurantId ? { ...r, wantToGo: { ...r.wantToGo, notNowAt: Date.now() } } : r,
        ),
      })
    }
  }

  function saveRestaurant(restaurant) {
    setData((current) => {
      const exists = current.restaurants.some((r) => r.id === restaurant.id)
      const restaurants = exists
        ? current.restaurants.map((r) => (r.id === restaurant.id ? restaurant : r))
        : [...current.restaurants, restaurant]
      return { ...current, restaurants }
    })
    setEditingId(null)
  }

  function deleteRestaurant(id) {
    setData((current) => ({
      restaurants: current.restaurants.filter((r) => r.id !== id),
      visits: current.visits.filter((v) => v.restaurantId !== id),
    }))
    setEditingId(null)
    setViewingId(null)
  }

  // Every cuisine used so far, offered as quick picks in the form.
  const knownCuisines = [...new Set(data.restaurants.flatMap((r) => r.cuisines))].sort()

  const promptedPlace = prompt && data.restaurants.find((r) => r.id === prompt.restaurantId)
  if (promptedPlace) {
    return (
      <LaunchPrompt type={prompt.type} restaurant={promptedPlace} onYes={answerYes} onNo={answerNo} />
    )
  }

  if (editingId !== null) {
    const restaurant = data.restaurants.find((r) => r.id === editingId)
    return (
      <RestaurantForm
        restaurant={restaurant}
        knownCuisines={knownCuisines}
        onSave={saveRestaurant}
        onDelete={deleteRestaurant}
        onCancel={() => setEditingId(null)}
      />
    )
  }

  const viewedPlace = data.restaurants.find((r) => r.id === viewingId)

  return (
    <div className="app">
      <main className={tab === 'home' ? 'screen home-screen' : 'screen'}>
        {tab === 'home' && (
          <Home
            restaurants={data.restaurants}
            visits={data.visits}
            matches={matches}
            picked={data.restaurants.find((r) => r.id === pickedId)}
            filters={filters}
            cuisineOptions={[...new Set([...knownCuisines, ...filters.cuisines])].sort()}
            here={here}
            locationStatus={locationStatus}
            canPick={canPick}
            onFiltersChange={changeFilters}
            onPick={pickForUs}
            went={wentId !== null && wentId === pickedId}
            onGoHere={goHere}
            onUndoGoHere={undoGoHere}
            onGoToList={() => setTab('list')}
          />
        )}
        {tab === 'list' && showBackup && (
          <Backup data={data} onBack={() => setShowBackup(false)} onImport={importBackup} />
        )}
        {tab === 'list' && !showBackup && viewedPlace && (
          <RestaurantDetail
            restaurant={viewedPlace}
            visits={data.visits}
            onBack={() => setViewingId(null)}
            onEdit={() => setEditingId(viewedPlace.id)}
            onToggleWantToGo={() => toggleWantToGo(viewedPlace)}
            onWeWentHere={() => weWentHere(viewedPlace)}
          />
        )}
        {tab === 'list' && !showBackup && !viewedPlace && (
          <RestaurantList
            restaurants={data.restaurants}
            onAdd={() => setEditingId('new')}
            onOpen={(id) => setViewingId(id)}
            onBackup={() => setShowBackup(true)}
            // Test version on your Mac only: the published app has no button.
            onLoadTestData={import.meta.env.DEV ? () => setData(addTestData) : null}
          />
        )}
      </main>

      <nav className="tabs">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          Pick
        </button>
        <button
          className={tab === 'list' ? 'active' : ''}
          onClick={() => {
            setTab('list')
            // Tapping the tab always goes back to the full list.
            setViewingId(null)
            setShowBackup(false)
          }}
        >
          Restaurants
        </button>
      </nav>
    </div>
  )
}
