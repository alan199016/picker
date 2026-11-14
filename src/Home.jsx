import { useState } from 'react'
import CardCarousel from './CardCarousel.jsx'
import FilterSheet from './FilterSheet.jsx'
import { NO_FILTERS, passesFilters } from './filters.js'

// The "Pick" tab: the title and a Filters button, a row of face-down cards,
// and the main button at the bottom. Tapping Pick for us spins the cards and
// flips one over. The picking itself happens in App, which remembers what's
// been shown; this screen handles how it looks.

export default function Home({
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
  // Where the cards are in their animation: idle, spinning, revealing or shown.
  const [phase, setPhase] = useState('idle')
  // The card sliding out after Pick another, until its animation ends.
  const [leaving, setLeaving] = useState(null)

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

  // Mid-animation, the animation decides. Otherwise: a picked place shows face
  // up (this also covers Go here on the want-to-go prompt), and no pick means
  // the still row of cards.
  const animating = phase === 'spinning' || phase === 'revealing'
  const stage = animating ? phase : picked ? 'shown' : 'idle'
  const noMatch = !picked && !animating && matches.length === 0 && canPick

  function pickForUs() {
    setLeaving(null)
    onPick()
    setPhase('spinning')
  }

  function pickAnother() {
    setLeaving(picked)
    onPick()
  }

  // How many kinds of filter are on, for the button's label.
  const activeFilters =
    (filters.cuisines.length > 0) + (filters.prices.length > 0) + (filters.maxMiles !== null)

  return (
    <div className="home">
      <header className="screen-header">
        <h1>Where to eat?</h1>
        <button
          className={activeFilters ? 'filter-button active' : 'filter-button'}
          onClick={() => setSheetOpen(true)}
          disabled={animating}
        >
          {activeFilters ? `Filters · ${activeFilters}` : 'Filters'}
        </button>
      </header>

      <div className="stage-area">
        {noMatch ? (
          <NoMatch
            restaurants={restaurants}
            filters={filters}
            here={here}
            onFiltersChange={onFiltersChange}
          />
        ) : (
          <CardCarousel
            phase={stage}
            picked={picked}
            leaving={leaving}
            visits={visits}
            onSpinEnd={() => setPhase('revealing')}
            onRevealEnd={() => setPhase('shown')}
            onLeaveEnd={() => setLeaving(null)}
          />
        )}
      </div>

      <div className="home-actions">
        {stage === 'shown' && went && (
          <p className="saved-line">
            Enjoy! Saved for today.{' '}
            <button className="link" onClick={onUndoGoHere}>
              Undo
            </button>
          </p>
        )}
        {stage === 'shown' && !went && (
          <div className="button-row">
            <button className="secondary big" onClick={pickAnother}>
              Pick another
            </button>
            <button className="primary big" onClick={() => onGoHere(picked)}>
              Go here
            </button>
          </div>
        )}
        {stage !== 'shown' && !noMatch && (
          <>
            <button className="primary big" onClick={pickForUs} disabled={!canPick || animating}>
              Pick for us
            </button>
            <p className="hint centered">
              {!canPick && locationStatus === 'locating' && 'Finding your location…'}
              {!canPick && locationStatus !== 'locating' && "Can't use your location. Change the distance filter."}
              {canPick &&
                (matches.length === restaurants.length
                  ? `From all ${restaurants.length} places`
                  : `From ${matches.length} of ${restaurants.length} places`)}
            </p>
          </>
        )}
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

// Shown when no restaurant passes the filters. Offers one button per active
// filter, each saying how many places dropping that filter would bring back.
function NoMatch({ restaurants, filters, here, onFiltersChange }) {
  const loosenings = [
    filters.cuisines.length > 0 && { label: 'Any cuisine', filters: { ...filters, cuisines: [] } },
    filters.prices.length > 0 && { label: 'Any price', filters: { ...filters, prices: [] } },
    filters.maxMiles !== null && { label: 'Any distance', filters: { ...filters, maxMiles: null } },
  ]
    .filter(Boolean)
    .map((option) => ({
      ...option,
      count: restaurants.filter((r) => passesFilters(r, option.filters, here)).length,
    }))

  return (
    <div className="no-match">
      <h2>Nothing matches</h2>
      <p>Loosen a filter to bring some places back:</p>
      <div className="loosen">
        {loosenings.map((option) => (
          <button
            key={option.label}
            className="secondary"
            disabled={option.count === 0}
            onClick={() => onFiltersChange(option.filters)}
          >
            {option.label} <span className="count">({option.count})</span>
          </button>
        ))}
        {loosenings.length > 1 && (
          <button className="link" onClick={() => onFiltersChange(NO_FILTERS)}>
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}
