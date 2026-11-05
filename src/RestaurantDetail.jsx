import { lastVisitDate, mapsLink, timeAgo } from './pick.js'
import { today } from './storage.js'

// One restaurant's page, reached by tapping it in the list.

export default function RestaurantDetail({
  restaurant,
  visits,
  onBack,
  onEdit,
  onToggleWantToGo,
  onWeWentHere,
}) {
  const confirmed = visits.filter((v) => v.status === 'confirmed')
  const lastVisit = lastVisitDate(restaurant, confirmed)
  const flagged = Boolean(restaurant.wantToGo)
  const wentToday = lastVisit === today()

  return (
    <div>
      <header className="screen-header">
        <button className="link" onClick={onBack}>
          ‹ Restaurants
        </button>
        <button className="link" onClick={onEdit}>
          Edit
        </button>
      </header>

      <h1>{restaurant.name}</h1>
      <p className="result-meta">
        {[restaurant.cuisines.join(', '), '$'.repeat(restaurant.price)]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className="result-meta">
        {lastVisit ? `Last visit: ${timeAgo(lastVisit)}` : 'No visits yet'}
      </p>
      {restaurant.address && <p className="result-meta">{restaurant.address}</p>}
      {restaurant.notes && <p className="result-notes">{restaurant.notes}</p>}

      <a className="directions" href={mapsLink(restaurant)} target="_blank" rel="noreferrer">
        Directions in Google Maps ↗
      </a>

      <div className="detail-actions">
        <button className="secondary big" onClick={onWeWentHere} disabled={wentToday}>
          {wentToday ? '✓ Visit saved for today' : 'We went here today'}
        </button>
        <button className={flagged ? 'primary big' : 'secondary big'} onClick={onToggleWantToGo}>
          {flagged ? '★ Want to go' : '☆ Flag as want to go'}
        </button>
        {flagged && (
          <p className="hint centered">
            Flagged {timeAgo(restaurant.wantToGo.since)}. Tap again to unflag.
          </p>
        )}
      </div>
    </div>
  )
}
