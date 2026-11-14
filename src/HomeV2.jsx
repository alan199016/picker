import { useRef, useState } from 'react'
import CardCarouselV2 from './CardCarouselV2.jsx'
import FilterSheet from './FilterSheet.jsx'
import { NoMatch } from './Home.jsx'

// Version 2 of the Pick tab: a centered title, a vertical column of cards,
// and swipes instead of buttons. Swipe up to spin; once a place is showing,
// swipe left or right for another, or tap Spin again. Takes the same props
// as version 1.

const SWIPE_PX = 50 // how far a finger must travel to count as a swipe

export default function HomeV2({
  restaurants,
  visits,
  matches,
  picked,
  filters,
  cuisineOptions,
  here,
  locationStatus,
  canPick,
  onFiltersChange,
  onPick,
  went,
  onGoHere,
  onUndoGoHere,
  onGoToList,
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  // Where the cards are in their animation: idle, spinning, revealing, shown,
  // or unrevealing (Spin again's reverse of the reveal, before the next spin).
  const [phase, setPhase] = useState('idle')
  // The card sliding out after a sideways swipe, and which way it's going.
  const [leaving, setLeaving] = useState(null)
  // Where the current touch (or mouse press) started.
  const swipeStart = useRef(null)

  if (restaurants.length === 0) {
    return (
      <div className="placeholder">
        <h1>Where to eat?</h1>
        <p>Add a few restaurants first.</p>
        <button className="primary" onClick={onGoToList}>
          Add restaurants
        </button>
      </div>
    )
  }

  // Same rules as version 1: mid-animation the animation decides; otherwise a
  // picked place shows face up, and no pick means the still column.
  const animating = phase === 'spinning' || phase === 'revealing' || phase === 'unrevealing'
  const stage = animating ? phase : picked ? 'shown' : 'idle'
  const noMatch = !picked && !animating && matches.length === 0 && canPick

  function spin() {
    if (animating || noMatch || !canPick) return
    setLeaving(null)
    onPick()
    setPhase('spinning')
  }

  // Spin again: first play the reveal backwards (the card shrinks and flips
  // face down, the other cards come back), then pick and spin once it's done.
  function spinAgain() {
    if (animating) return
    setLeaving(null)
    setPhase('unrevealing')
  }

  function startSpinAfterUnreveal() {
    onPick()
    setPhase('spinning')
  }

  function pickAnother(direction) {
    setLeaving({ restaurant: picked, direction })
    onPick()
  }

  // Swipes: compare where the finger went up with where it went down. Pointer
  // events cover fingers and the mouse, so dragging works on the Mac too.
  function handlePointerDown(event) {
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start || sheetOpen) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const upward = dy < -SWIPE_PX && Math.abs(dy) > Math.abs(dx)
    const sideways = Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)
    // Swiping up only starts the first spin; after that, Spin again does.
    if (upward && stage === 'idle') spin()
    else if (sideways && stage === 'shown' && !animating) pickAnother(dx < 0 ? 'left' : 'right')
  }

  const activeFilters =
    (filters.cuisines.length > 0) + (filters.prices.length > 0) + (filters.maxMiles !== null)

  return (
    <div
      className="home-v2"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (swipeStart.current = null)}
    >
      {!noMatch && (
        <CardCarouselV2
          phase={stage}
          picked={picked}
          leaving={leaving}
          visits={visits}
          went={went}
          onGoHere={onGoHere}
          onUndoGoHere={onUndoGoHere}
          onSpinAgain={spinAgain}
          onUnrevealEnd={startSpinAfterUnreveal}
          onSpinEnd={() => setPhase('revealing')}
          onRevealEnd={() => setPhase('shown')}
          onLeaveEnd={() => setLeaving(null)}
        />
      )}

      {/* The title and Filters button hide while the cards spin. */}
      <header className={stage === 'spinning' ? 'v2-header quiet' : 'v2-header'}>
        <h1>{stage === 'idle' ? 'Where to eat?' : 'Let’s go to…'}</h1>
        <button
          className={activeFilters ? 'filter-button active' : 'filter-button'}
          onClick={() => setSheetOpen(true)}
          disabled={animating}
        >
          {activeFilters ? `Filters · ${activeFilters}` : 'Filters'}
        </button>
      </header>

      <div className="v2-middle">
        {noMatch && (
          <NoMatch
            restaurants={restaurants}
            filters={filters}
            here={here}
            onFiltersChange={onFiltersChange}
          />
        )}
      </div>

      <div className={animating ? 'v2-bottom quiet' : 'v2-bottom'}>
        {stage === 'idle' && !noMatch && canPick && (
          // Tapping works too, for anyone who'd rather not swipe.
          <button className="swipe-hint" onClick={spin}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Swipe up to pick
          </button>
        )}
        {stage === 'idle' && !canPick && (
          <p className="hint centered">
            {locationStatus === 'locating'
              ? 'Finding your location…'
              : "Can't use your location. Change the distance filter."}
          </p>
        )}
        {stage === 'shown' && <p className="hint centered">‹ Swipe for another ›</p>}
      </div>

      {sheetOpen && (
        <FilterSheet
          filters={filters}
          cuisineOptions={cuisineOptions}
          locationStatus={locationStatus}
          matchCount={matches.length}
          onChange={onFiltersChange}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
