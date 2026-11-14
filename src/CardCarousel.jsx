import { useEffect, useLayoutEffect, useRef } from 'react'
import { lastVisitDate, mapsLink, timeAgo } from './pick.js'

// The row of cards on the Pick tab, and its animations. Home decides which
// stage we're in (`phase`); this file only draws it:
//   idle      a still row of face-down cards
//   spinning  the row slides left like a carousel, slows down and stops
//   revealing the middle card lifts and flips over; the others drop and fade
//   shown     just the picked card, face up. On Pick another, the old card
//             (`leaving`) slides out left while the new one comes in from the right.

const GAP = 16 // px between cards, matching the CSS
const START = 2 // the card in the middle before spinning
const SPIN_CARDS = 18 // how many cards pass by during a spin
const END = START + SPIN_CARDS // the card in the middle when the spin stops
const CARD_COUNT = END + 3 // a few extra so the right side never looks empty
const SPIN_MS = 2000
const SIDE_SCALE = 0.8 // cards away from the middle are 80% of full size

// Sizes and places every card for where the row is right now. `center` is
// the card in the middle, counting from 0; mid-spin it's a fraction, like 7.4.
function arrangeCards(strip, center) {
  const slots = strip.children
  const width = slots[0].offsetWidth
  const step = width + GAP // where cards sit before resizing

  // Full size in the middle, easing down to 80% one card away.
  const scales = [...slots].map((_, i) => 1 - (1 - SIDE_SCALE) * Math.min(1, Math.abs(i - center)))
  // Distance between the middles of card i and the card after it, so the
  // visible gap between them is exactly 16px whatever their sizes.
  const spacing = (i) => ((scales[i] + scales[i + 1]) / 2) * width + GAP

  // Place the card just left of the middle first, then each neighbor from
  // the one before it. `x` is each card's distance from the middle, in px.
  const left = Math.min(Math.floor(center), slots.length - 2)
  const x = []
  x[left] = -(center - left) * spacing(left)
  for (let i = left + 1; i < slots.length; i++) x[i] = x[i - 1] + spacing(i - 1)
  for (let i = left - 1; i >= 0; i--) x[i] = x[i + 1] - spacing(i)

  for (let i = 0; i < slots.length; i++) {
    const shift = x[i] - (i - center) * step // from its unresized spot to its place
    slots[i].style.transform = `translateX(${shift}px) scale(${scales[i]})`
  }
}

export default function CardCarousel({
  phase,
  picked,
  leaving,
  visits,
  onSpinEnd,
  onRevealEnd,
  onLeaveEnd,
}) {
  const stripRef = useRef(null)

  // Before the still row is first drawn, shrink the cards beside the middle.
  useLayoutEffect(() => {
    if (phase === 'idle') arrangeCards(stripRef.current, START)
  }, [phase])

  // Always call the newest onSpinEnd, without restarting the spin when it changes.
  const latestOnSpinEnd = useRef(onSpinEnd)
  useEffect(() => {
    latestOnSpinEnd.current = onSpinEnd
  })

  // The spin. It uses the browser's built-in animation tool (element.animate)
  // because the distance depends on the card size, which depends on the screen.
  useEffect(() => {
    if (phase !== 'spinning') return
    const strip = stripRef.current
    const step = strip.firstChild.offsetWidth + GAP
    const at = (card) => `translateX(${-card * step}px)`
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Three parts: a quick speed-up over the first 2 cards, a fast cruise
    // (about 12 cards a second) for 11, then a slow-down over the last 5,
    // like a wheel coming to rest.
    const spin = strip.animate(
      [
        { transform: at(START), easing: 'ease-in' },
        { transform: at(START + 2), offset: 0.14, easing: 'linear' },
        { transform: at(START + 13), offset: 0.6, easing: 'cubic-bezier(0.33, 0.67, 0.67, 1)' },
        { transform: at(END) },
      ],
      // fill: 'forwards' keeps the row where it stopped, for the reveal.
      { duration: reduceMotion ? 1 : SPIN_MS, fill: 'forwards' },
    )
    // On every frame of the spin, check where the row is and resize the cards,
    // so each one grows as it passes the middle and shrinks as it leaves.
    let frame = requestAnimationFrame(function follow() {
      const x = new DOMMatrix(getComputedStyle(strip).transform).m41
      arrangeCards(strip, -x / step)
      frame = requestAnimationFrame(follow)
    })

    // `finished` is a promise that settles the moment the spin ends, even if
    // the screen isn't redrawing then (say, the phone locked mid-spin).
    let stillWanted = true
    spin.finished
      .then(() => {
        cancelAnimationFrame(frame)
        arrangeCards(strip, END)
        if (stillWanted) latestOnSpinEnd.current()
      })
      .catch(() => {})
    return () => {
      stillWanted = false
      cancelAnimationFrame(frame)
    }
  }, [phase])

  const showRow = phase === 'idle' || phase === 'spinning' || phase === 'revealing'

  return (
    <div className="stage">
      {showRow && (
        <div className="strip" ref={stripRef}>
          {Array.from({ length: CARD_COUNT }, (_, i) => {
            let className = 'card card-front'
            // During the reveal, a flipping copy takes the middle card's place.
            if (phase === 'revealing') className += i === END ? ' hidden' : ' drop'
            // The outer slot gets resized by arrangeCards; the card inside is
            // free to run its own drop animation during the reveal.
            return (
              <div key={i} className="slot">
                <div className={className}>
                  <ForkAndKnife />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {phase === 'revealing' && (
        <PickedCard restaurant={picked} visits={visits} className="hero revealing" onDone={onRevealEnd} />
      )}

      {phase === 'shown' && leaving && (
        <PickedCard
          key={`leaving-${leaving.id}`}
          restaurant={leaving}
          visits={visits}
          className="hero shown exit-left"
          onDone={onLeaveEnd}
        />
      )}
      {phase === 'shown' && (
        <PickedCard
          key={picked.id}
          restaurant={picked}
          visits={visits}
          className={leaving ? 'hero shown enter-right' : 'hero shown'}
        />
      )}
    </div>
  )
}

// A two-sided card: face-down front, details on the back.
function PickedCard({ restaurant, visits, className, onDone }) {
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
          {restaurant.notes && <p className="card-notes">{restaurant.notes}</p>}
          <a className="directions" href={mapsLink(restaurant)} target="_blank" rel="noreferrer">
            Directions in Google Maps ↗
          </a>
        </article>
      </div>
    </div>
  )
}

// The app icon's fork and knife, drawn in the card's text color.
function ForkAndKnife() {
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
