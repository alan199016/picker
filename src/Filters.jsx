import { DISTANCE_CHOICES } from './filters.js'

// The three filters at the top of the Pick tab. They don't keep any state of
// their own: App holds the filters, and this just shows them and reports taps.

export default function Filters({ filters, cuisineOptions, locationStatus, onChange }) {
  // Adds the value to the list if it's not there, removes it if it is.
  function toggle(list, value) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  return (
    <section className="filters">
      {cuisineOptions.length > 0 && (
        <div className="filter">
          <span className="filter-label">Cuisine</span>
          <div className="chips">
            {cuisineOptions.map((c) => (
              <button
                key={c}
                className={filters.cuisines.includes(c) ? 'chip selected' : 'chip'}
                onClick={() => onChange({ ...filters, cuisines: toggle(filters.cuisines, c) })}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter">
        <span className="filter-label">Price</span>
        <div className="segmented">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              className={filters.prices.includes(level) ? 'selected' : ''}
              onClick={() => onChange({ ...filters, prices: toggle(filters.prices, level) })}
            >
              {'$'.repeat(level)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter">
        <span className="filter-label">Distance</span>
        <div className="segmented">
          {DISTANCE_CHOICES.map((miles) => (
            <button
              key={String(miles)}
              className={filters.maxMiles === miles ? 'selected' : ''}
              onClick={() => onChange({ ...filters, maxMiles: miles })}
            >
              {miles === null ? 'Any' : `< ${miles} mi`}
            </button>
          ))}
        </div>
        {filters.maxMiles !== null && (
          <p className="hint">
            {locationStatus === 'locating' && 'Finding your location…'}
            {locationStatus === 'denied' &&
              'Location is off for this app. Allow it in Settings, or choose Any.'}
            {locationStatus === 'unavailable' &&
              "This browser can't share your location here. Choose Any for now."}
          </p>
        )}
      </div>
    </section>
  )
}
