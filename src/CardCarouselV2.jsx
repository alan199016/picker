import { useRef } from 'react'
import { useCardRow } from './carousel.js'
import { CardRow, PickedCard } from './Cards.jsx'

// Version 2's cards: a vertical column that fills the screen behind the
// title and hints, fading out toward the top and bottom edges. Stages:
//   idle      a still column of face-down cards
//   spinning  the column slides up, slows down and stops
//   revealing the middle card grows and flips over; the others fade away
//   unrevealing  Spin again: the reveal in reverse, before the next spin
//   shown     just the picked card, face up, with Spin again below it. On a
//             sideways swipe, the old card
//             (`leaving`) slides out that way and the new one comes in from the
//             other side.

export default function CardCarouselV2({
  phase,
  picked,
  leaving,
  visits,
  went,
  onGoHere,
  onUndoGoHere,
  onSpinAgain,
  onUnrevealEnd,
  onSpinEnd,
  onRevealEnd,
  onLeaveEnd,
}) {
  const stripRef = useRef(null)
  // Vertical, with the cards above and below the middle at 95%.
  useCardRow(stripRef, phase, 'y', onSpinEnd, 0.95)

  const showRow = phase !== 'shown'

  // Go here lives inside the card, under the directions. Once tapped, it
  // becomes the "Saved" line.
  const actions = (restaurant) =>
    went && restaurant.id === picked?.id ? (
      <p className="saved-line">
        Enjoy! Saved for today.{' '}
        <button className="link" onClick={onUndoGoHere}>
          Undo
        </button>
      </p>
    ) : (
      <button className="primary card-go" onClick={() => onGoHere(restaurant)}>
        Go here
      </button>
    )

  return (
    <div className="v2-stage">
      {showRow && (
        <div className="v2-column">
          <CardRow stripRef={stripRef} phase={phase} />
        </div>
      )}

      {phase === 'revealing' && (
        <PickedCard
          restaurant={picked}
          visits={visits}
          className="hero revealing"
          eyebrow={false}
          actions={actions(picked)}
          onDone={onRevealEnd}
        />
      )}

      {phase === 'unrevealing' && (
        <PickedCard
          restaurant={picked}
          visits={visits}
          className="hero unrevealing"
          eyebrow={false}
          actions={actions(picked)}
          onDone={onUnrevealEnd}
        />
      )}

      {phase === 'shown' && leaving && (
        <PickedCard
          key={`leaving-${leaving.restaurant.id}`}
          restaurant={leaving.restaurant}
          visits={visits}
          className={`hero shown exit-${leaving.direction}`}
          eyebrow={false}
          actions={actions(leaving.restaurant)}
          onDone={onLeaveEnd}
        />
      )}
      {phase === 'shown' && (
        <PickedCard
          key={picked.id}
          restaurant={picked}
          visits={visits}
          // It comes in from the side opposite to where the old card went.
          className={
            leaving ? `hero shown enter-${leaving.direction === 'left' ? 'right' : 'left'}` : 'hero shown'
          }
          eyebrow={false}
          actions={actions(picked)}
        />
      )}

      {phase === 'shown' && (
        <button className="spin-again" onClick={onSpinAgain}>
          Spin again
        </button>
      )}
    </div>
  )
}
