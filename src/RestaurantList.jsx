// The "Restaurants" tab: every restaurant, A to Z, plus an Add button.

export default function RestaurantList({ restaurants, onAdd, onOpen, onBackup, onLoadTestData }) {
  const sorted = [...restaurants].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <header className="screen-header">
        <h1>Restaurants</h1>
        <div className="header-actions">
          <button className="link" onClick={onBackup}>
            Backup
          </button>
          <button className="primary small" onClick={onAdd}>
            + Add
          </button>
        </div>
      </header>

      {sorted.length === 0 ? (
        <p className="empty">No restaurants yet. Add the places you like to go.</p>
      ) : (
        <ul className="list">
          {sorted.map((r) => (
            <li key={r.id}>
              <button className="row" onClick={() => onOpen(r.id)}>
                <span className="row-title">
                  {r.name}
                  {r.wantToGo && <span className="tag">Want to go</span>}
                </span>
                <span className="row-meta">
                  {[r.cuisines.join(', '), '$'.repeat(r.price)].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {onLoadTestData && (
        <div className="test-tools">
          <button className="link" onClick={onLoadTestData}>
            Load 20 test restaurants
          </button>
          <p className="hint">Only in the test version on your Mac. Replaces earlier test restaurants.</p>
        </div>
      )}
    </div>
  )
}
