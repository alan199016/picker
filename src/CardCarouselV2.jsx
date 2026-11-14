import { useRef } from 'react'
import { useCardRow } from './carousel.js'
import { CardRow, PickedCard } from './Cards.jsx'

// Version 2's cards: a vertical column that fills the screen behind the
// title and hints, fading out toward the top and bottom edges. Stages:
//   idle      a still column of face-down cards
//   spinning  the column slides up, slows down and stops
//   revealing the middle card grows and flips over; the others dim and blur
//   shown     the picked card, face up, over the dimmed column, with Choose another below it
//   unrevealing  Choose another: the reveal in reverse, before the next spin

export default function CardCarouselV2({
  phase,
  picked,
  visits,
  went,
  onGoHere,
  onUndoGoHere,
  onChooseAnother,
  onUnrevealEnd,
  onSpinEnd,
  onRevealEnd,
}) {
  const stripRef = useRef(null)
  // Vertical, with the cards above and below the middle at 95%.
  useCardRow(stripRef, phase, 'y', onSpinEnd, 0.95)

  // The column stays on screen the whole time. Behind a picked card it's
  // dimmed and blurred; it clears again as Choose another flips the card back.
  const dimmed = phase === 'revealing' || phase === 'shown'

  // Go here lives inside the card, under the directions. Once tapped, it
  // becomes the "Saved" line.
  const actions = went ? (
    <p className="saved-line">
      Enjoy! Saved for today.{' '}
      <button className="link" onClick={onUndoGoHere}>
        Undo
      </button>
    </p>
  ) : (
    <button className="primary card-go" onClick={() => onGoHere(picked)}>
      Go here
    </button>
  )

  return (
    <div className="v2-stage">
      <div className={dimmed ? 'v2-column dimmed' : 'v2-column'}>
        <CardRow stripRef={stripRef} phase={phase} keepOthers />
      </div>

      {/* "Let's go to" appears just above the card as it's revealed. */}
      {(phase === 'revealing' || phase === 'shown') && <h1 className="v2-card-title">Let’s go to</h1>}

      {phase === 'revealing' && (
        <PickedCard
          restaurant={picked}
          visits={visits}
          className="hero revealing"
          eyebrow={false}
          actions={actions}
          onDone={onRevealEnd}
        />
      )}

      {phase === 'unrevealing' && (
        <PickedCard
          restaurant={picked}
          visits={visits}
          className="hero unrevealing"
          eyebrow={false}
          actions={actions}
          onDone={onUnrevealEnd}
        />
      )}

      {phase === 'shown' && (
        <PickedCard
          restaurant={picked}
          visits={visits}
          className="hero shown"
          eyebrow={false}
          actions={actions}
        />
      )}

      {phase === 'shown' && (
        <button className="choose-another" onClick={onChooseAnother}>
          Choose another
        </button>
      )}
    </div>
  )
}
