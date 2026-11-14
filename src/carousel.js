import { useEffect, useLayoutEffect, useRef } from 'react'

// The card row's movement, shared by both versions of the Pick screen:
// version 1 moves the row sideways (axis 'x'), version 2 moves it up ('y').

export const GAP = 16 // px between cards, matching the CSS
export const START = 2 // the card in the middle before spinning
const SPIN_CARDS = 18 // how many cards pass by during a spin
export const END = START + SPIN_CARDS // the card in the middle when the spin stops
export const CARD_COUNT = END + 3 // a few extra so the far side never looks empty
const SPIN_MS = 2000

// Sizes and places every card for where the row is right now. `center` is
// the card in the middle, counting from 0; mid-spin it's a fraction, like 7.4.
// `sideScale` is how big the cards away from the middle are, like 0.8 for 80%.
function arrangeCards(strip, center, axis, sideScale) {
  const slots = strip.children
  const size = slots[0].offsetWidth // cards are square, so this is also the height
  const step = size + GAP // where cards sit before resizing

  // Full size in the middle, easing down to sideScale one card away.
  const scales = [...slots].map((_, i) => 1 - (1 - sideScale) * Math.min(1, Math.abs(i - center)))
  // Distance between the middles of card i and the card after it, so the
  // visible gap between them is exactly 16px whatever their sizes.
  const spacing = (i) => ((scales[i] + scales[i + 1]) / 2) * size + GAP

  // Place the card just before the middle first, then each neighbor from
  // the one before it. `pos` is each card's distance from the middle, in px.
  const before = Math.min(Math.floor(center), slots.length - 2)
  const pos = []
  pos[before] = -(center - before) * spacing(before)
  for (let i = before + 1; i < slots.length; i++) pos[i] = pos[i - 1] + spacing(i - 1)
  for (let i = before - 1; i >= 0; i--) pos[i] = pos[i + 1] - spacing(i)

  const translate = axis === 'x' ? 'translateX' : 'translateY'
  for (let i = 0; i < slots.length; i++) {
    const shift = pos[i] - (i - center) * step // from its unresized spot to its place
    slots[i].style.transform = `${translate}(${shift}px) scale(${scales[i]})`
  }
}

// Puts the row still, with card `index` in the middle: stops any earlier
// spin and sets the position directly.
function placeAt(strip, index, axis, sideScale) {
  const step = strip.firstChild.offsetWidth + GAP
  strip.getAnimations().forEach((animation) => animation.cancel())
  strip.style.transform = `${axis === 'x' ? 'translateX' : 'translateY'}(${-index * step}px)`
  arrangeCards(strip, index, axis, sideScale)
}

// Runs the row for the current phase: holds it still before and after a
// spin, spins it while 'spinning', and calls onSpinEnd when the spin stops.
export function useCardRow(stripRef, phase, axis, onSpinEnd, sideScale) {
  // Before the row is drawn: the start position before and during a spin
  // (the spin begins there), the stopping card after it. Every card looks the
  // same face down, so jumping between the two never shows.
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const settled = phase === 'revealing' || phase === 'shown' || phase === 'unrevealing'
    const place = () => placeAt(strip, settled ? END : START, axis, sideScale)
    place()

    // Positions are worked out in pixels from the card size, which depends
    // on the screen size. If the screen changes (rotating, or the phone's
    // bars settling in right after launch), work them out again. Not mid-spin:
    // the spin re-measures the cards on every frame anyway.
    if (phase === 'spinning') return
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [phase, axis, stripRef, sideScale])

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
    const translate = axis === 'x' ? 'translateX' : 'translateY'
    const at = (card) => `${translate}(${-card * step}px)`
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
      const matrix = new DOMMatrix(getComputedStyle(strip).transform)
      arrangeCards(strip, -(axis === 'x' ? matrix.m41 : matrix.m42) / step, axis, sideScale)
      frame = requestAnimationFrame(follow)
    })

    // `finished` is a promise that settles the moment the spin ends, even if
    // the screen isn't redrawing then (say, the phone locked mid-spin).
    let stillWanted = true
    spin.finished
      .then(() => {
        cancelAnimationFrame(frame)
        arrangeCards(strip, END, axis, sideScale)
        if (stillWanted) latestOnSpinEnd.current()
      })
      .catch(() => {})
    return () => {
      stillWanted = false
      cancelAnimationFrame(frame)
    }
  }, [phase, axis, stripRef, sideScale])
}
