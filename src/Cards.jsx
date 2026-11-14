import { CARD_COUNT, END } from './carousel.js'
import { lastVisitDate, mapsLink, timeAgo } from './pick.js'

// The card pieces both versions of the Pick screen are built from.

// The row of face-down cards. During the reveal, a flipping copy takes the
// middle card's place and the rest go away; while unrevealing, they come back.
export function CardRow({ stripRef, phase }) {
  return (
    <div className="strip" ref={stripRef}>
      {Array.from({ length: CARD_COUNT }, (_, i) => {
        let className = 'card card-front'
        if (phase === 'revealing') className += i === END ? ' hidden' : ' drop'
        if (phase === 'unrevealing') className += i === END ? ' hidden' : ' return'
        // The outer slot gets resized by the carousel; the card inside is free
        // to run its own animation during the reveal.
        return (
          <div key={i} className="slot">
            <div className={className}>
              <ForkAndKnife />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// A two-sided card: face-down front, details on the back. Version 2 hides the
// "Let's go to" line (`eyebrow`) and puts its buttons (`actions`) inside.
export function PickedCard({ restaurant, visits, className, onDone, eyebrow = true, actions }) {
  // The last visit before today's plan, so the card doesn't say "today".
  const lastVisit = lastVisitDate(
    restaurant,
    visits.filter((v) => v.status === 'confirmed'),
  )

  return (
    <div
      className={className}
      // The flip inside also fires animation events; only react to this card's own.
      onAnimationEnd={(event) => event.target === event.currentTarget && onDone?.()}
    >
      <div className="flip">
        <div className="card card-front face">
          <ForkAndKnife />
        </div>
        <article className="card card-back face">
          {eyebrow && <p className="eyebrow">Let's go to</p>}
          <h2>{restaurant.name}</h2>
          <p className="result-meta">
            {[restaurant.cuisines.join(', '), '$'.repeat(restaurant.price)]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="result-meta">
            {lastVisit ? `Last visit: ${timeAgo(lastVisit)}` : 'No visits yet'}
          </p>
          {restaurant.notes && <p className="card-notes">{restaurant.notes}</p>}
          <a className="directions" href={mapsLink(restaurant)} target="_blank" rel="noreferrer">
            Directions in Google Maps ↗
          </a>
          {actions}
        </article>
      </div>
    </div>
  )
}

// The app icon's fork and knife, drawn in the card's text color.
export function ForkAndKnife() {
  return (
    <svg className="card-icon" viewBox="0 0 512 512" aria-hidden="true">
      <g fill="currentColor">
        <rect x="140" y="96" width="20" height="120" rx="10" />
        <rect x="178" y="96" width="20" height="120" rx="10" />
        <rect x="216" y="96" width="20" height="120" rx="10" />
        <path d="M140 200h96v22c0 26-14 44-32 52v130a16 16 0 0 1-32 0V274c-18-8-32-26-32-52z" />
        <path d="M308 96c40 22 64 78 64 150 0 16-10 26-26 26h-6v132a16 16 0 0 1-32 0z" />
      </g>
    </svg>
  )
}
