import Filters from './Filters.jsx'
import { NO_FILTERS, isFiltered } from './filters.js'

// The panel that slides up from the bottom when you tap Filters.
// Tapping outside it, or the button at the bottom, closes it.

export default function FilterSheet({
  filters,
  cuisineOptions,
  locationStatus,
  matchCount,
  onChange,
  onClose,
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Filters"
        // Taps inside the panel shouldn't reach the backdrop and close it.
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-header">
          <h2>Filters</h2>
          {isFiltered(filters) && (
            <button className="link" onClick={() => onChange(NO_FILTERS)}>
              Clear all
            </button>
          )}
        </header>

        <Filters
          filters={filters}
          cuisineOptions={cuisineOptions}
          locationStatus={locationStatus}
          onChange={onChange}
        />

        <button className="primary big" onClick={onClose}>
          {matchCount === 0
            ? 'Done · nothing matches'
            : `Show ${matchCount} ${matchCount === 1 ? 'place' : 'places'}`}
        </button>
      </div>
    </div>
  )
}
