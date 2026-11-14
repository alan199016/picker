import { useRef } from 'react'
import { useCardRow } from './carousel.js'
import { CardRow, PickedCard } from './Cards.jsx'

// Version 1's cards: a sideways row. Home decides which stage we're in
// (`phase`); this file only draws it:
//   idle      a still row of face-down cards
//   spinning  the row slides left like a carousel, slows down and stops
//   revealing the middle card lifts and flips over; the others drop and fade
//   shown     just the picked card, face up. On Pick another, the old card
//             (`leaving`) slides out left while the new one comes in from the right.

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
  // Sideways, with the cards beside the middle at 80%.
  useCardRow(stripRef, phase, 'x', onSpinEnd, 0.8)

  const showRow = phase === 'idle' || phase === 'spinning' || phase === 'revealing'

  return (
    <div className="stage">
      {showRow && <CardRow stripRef={stripRef} phase={phase} />}

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
