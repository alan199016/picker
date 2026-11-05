import { useState } from 'react'
import { newId, today } from './storage.js'
import { lookUpAddress } from './geocode.js'

// The Add / Edit screen. When `restaurant` is given we're editing it;
// otherwise we're adding a new one.

export default function RestaurantForm({ restaurant, knownCuisines, onSave, onDelete, onCancel }) {
  const isNew = !restaurant

  // Each field gets its own piece of state, filled from the restaurant
  // being edited (or left blank for a new one).
  const [name, setName] = useState(restaurant?.name ?? '')
  const [cuisines, setCuisines] = useState(restaurant?.cuisines ?? [])
  const [cuisineDraft, setCuisineDraft] = useState('')
  const [price, setPrice] = useState(restaurant?.price ?? null)
  const [address, setAddress] = useState(restaurant?.address ?? '')
  const [location, setLocation] = useState(restaurant?.location ?? null)
  const [lookup, setLookup] = useState('idle') // idle | searching | not-found | error
  const [notes, setNotes] = useState(restaurant?.notes ?? '')

  const canSave = name.trim() !== '' && price !== null

  function addCuisine(tag) {
    const clean = tag.trim()
    // Ignore blanks and duplicates (case-insensitive: "thai" = "Thai").
    if (clean && !cuisines.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      setCuisines([...cuisines, clean])
    }
    setCuisineDraft('')
  }

  function removeCuisine(tag) {
    setCuisines(cuisines.filter((c) => c !== tag))
  }

  function changeAddress(text) {
    setAddress(text)
    // The old coordinates no longer match the new address.
    setLocation(null)
    setLookup('idle')
  }

  async function findAddress() {
    setLookup('searching')
    try {
      const found = await lookUpAddress(address)
      setLocation(found)
      setLookup(found ? 'idle' : 'not-found')
    } catch {
      setLookup('error')
    }
  }

  function save(event) {
    event.preventDefault()
    // A tag typed but not yet added still counts.
    const finalCuisines = cuisineDraft.trim() ? [...cuisines, cuisineDraft.trim()] : cuisines
    onSave({
      ...restaurant, // keeps fields this form doesn't touch, like the date added
      id: restaurant?.id ?? newId(),
      dateAdded: restaurant?.dateAdded ?? today(),
      name: name.trim(),
      cuisines: finalCuisines,
      price,
      address: address.trim(),
      location,
      notes: notes.trim(),
    })
  }

  function confirmDelete() {
    if (window.confirm(`Delete ${restaurant.name}? Its visit history goes too.`)) {
      onDelete(restaurant.id)
    }
  }

  const suggestions = knownCuisines.filter((c) => !cuisines.includes(c))

  return (
    <form className="app form" onSubmit={save}>
      <header className="form-header">
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
        <h1>{isNew ? 'Add restaurant' : 'Edit restaurant'}</h1>
        <button type="submit" className="link strong" disabled={!canSave}>
          Save
        </button>
      </header>

      <div className="screen">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus={isNew} />
        </label>

        <div className="field">
          <span>Cuisine</span>
          <div className="chips">
            {cuisines.map((c) => (
              <button type="button" key={c} className="chip selected" onClick={() => removeCuisine(c)}>
                {c} ×
              </button>
            ))}
          </div>
          <input
            value={cuisineDraft}
            placeholder="Type a cuisine, then Return"
            onChange={(e) => setCuisineDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault() // don't submit the form
                addCuisine(cuisineDraft)
              }
            }}
          />
          {suggestions.length > 0 && (
            <div className="chips">
              {suggestions.map((c) => (
                <button type="button" key={c} className="chip" onClick={() => addCuisine(c)}>
                  + {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <span>Price</span>
          <div className="segmented">
            {[1, 2, 3, 4].map((level) => (
              <button
                type="button"
                key={level}
                className={price === level ? 'selected' : ''}
                onClick={() => setPrice(level)}
              >
                {'$'.repeat(level)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Address</span>
          <div className="input-with-button">
            <input value={address} onChange={(e) => changeAddress(e.target.value)} />
            <button
              type="button"
              onClick={findAddress}
              disabled={address.trim() === '' || lookup === 'searching'}
            >
              {lookup === 'searching' ? 'Finding…' : 'Find'}
            </button>
          </div>
          <p className="hint">
            {location && `✓ Found: ${location.label}`}
            {!location && lookup === 'idle' && address.trim() !== '' &&
              'Tap Find so the distance filter can use this address.'}
            {lookup === 'not-found' && 'No match. Try adding the city, or the street address.'}
            {lookup === 'error' && "Couldn't reach the lookup service. Check your connection."}
          </p>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea
            value={notes}
            rows={3}
            placeholder="What to order, who likes it…"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {!isNew && (
          <button type="button" className="danger" onClick={confirmDelete}>
            Delete restaurant
          </button>
        )}
      </div>
    </form>
  )
}
