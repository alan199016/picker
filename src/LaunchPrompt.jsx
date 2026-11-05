// The full-screen question shown when the app opens. The same layout serves
// every launch prompt; only the wording and the two buttons change.

const WORDING = {
  'did-you-go': { eyebrow: 'Did you end up going to', yes: 'Yes, we went', no: 'No' },
  'want-to-go': { eyebrow: 'You wanted to try', yes: 'Go here', no: 'Not now' },
}

export default function LaunchPrompt({ type, restaurant, onYes, onNo }) {
  const words = WORDING[type]
  return (
    <div className="app">
      <main className="screen prompt">
        <article className="result-card">
          <p className="eyebrow">{words.eyebrow}</p>
          <h2>{restaurant.name}</h2>
          <p className="result-meta">
            {[restaurant.cuisines.join(', '), '$'.repeat(restaurant.price)]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {restaurant.notes && <p className="result-notes">{restaurant.notes}</p>}
        </article>
        <button className="primary big" onClick={onYes}>
          {words.yes}
        </button>
        <button className="secondary big" onClick={onNo}>
          {words.no}
        </button>
      </main>
    </div>
  )
}
