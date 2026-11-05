import Filters from './Filters.jsx'
import { NO_FILTERS, passesFilters } from './filters.js'
import { lastVisitDate, mapsLink, timeAgo } from './pick.js'

// The "Pick" tab: filters at the top, then either the Pick button, the
// result card, or the No match state. The picking itself happens in App,
// which remembers what's been shown.

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

  return (
    <div className="home">
      <h1>Where to eat?</h1>
      <Filters
        filters={filters}
        cuisineOptions={cuisineOptions}
        locationStatus={locationStatus}
        onChange={onFiltersChange}
      />

      {picked ? (
        <ResultCard
          restaurant={picked}
          visits={visits}
          went={went}
          onGoHere={() => onGoHere(picked)}
          onUndoGoHere={onUndoGoHere}
          onPickAnother={onPick}
        />
      ) : matches.length === 0 && canPick ? (
        <NoMatch
          restaurants={restaurants}
          filters={filters}
          here={here}
          onFiltersChange={onFiltersChange}
        />
      ) : (
        <div className="pick-area">
          <button className="primary big" onClick={onPick} disabled={!canPick}>
            Pick for us
          </button>
          {canPick && (
            <p className="hint centered">
              {matches.length === restaurants.length
                ? `From all ${restaurants.length} places`
                : `From ${matches.length} of ${restaurants.length} places`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Once you tap Go here (`went`), the buttons give way to a quiet "Saved"
// line, so there's nothing new to read.
function ResultCard({ restaurant, visits, went, onGoHere, onUndoGoHere, onPickAnother }) {
  // The last visit before today's plan, so the card doesn't flip to "today".
  const lastVisit = lastVisitDate(
    restaurant,
    visits.filter((v) => v.status === 'confirmed'),
  )
  return (
    <div className="pick-area">
      <article className="result-card">
        <p className="eyebrow">Let's go to</p>
        <h2>{restaurant.name}</h2>
        <p className="result-meta">
          {[restaurant.cuisines.join(', '), '$'.repeat(restaurant.price)]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="result-meta">
          {lastVisit ? `Last visit: ${timeAgo(lastVisit)}` : 'No visits yet'}
        </p>
        {restaurant.notes && <p className="result-notes">{restaurant.notes}</p>}
        <a className="directions" href={mapsLink(restaurant)} target="_blank" rel="noreferrer">
          Directions in Google Maps ↗
        </a>
      </article>

      {went ? (
        <p className="saved-line">
          Enjoy! Saved for today.{' '}
          <button className="link" onClick={onUndoGoHere}>
            Undo
          </button>
        </p>
      ) : (
        <>
          <button className="primary big" onClick={onGoHere}>
            Go here
          </button>
          <button className="secondary big" onClick={onPickAnother}>
            Pick another
          </button>
        </>
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
