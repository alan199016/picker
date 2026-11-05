import { useState } from 'react'
import { backupFileName, makeBackup, readBackup, saveFile } from './backup.js'
import { timeAgo } from './pick.js'
import { loadLastBackup, loadUnreadable, saveLastBackup, today } from './storage.js'

// The Backup screen, reached from the Restaurants tab.

export default function Backup({ data, onBack, onImport }) {
  const [lastBackup, setLastBackup] = useState(loadLastBackup)
  const [message, setMessage] = useState('')
  const unreadable = loadUnreadable()

  async function exportList() {
    setMessage('')
    const saved = await saveFile(makeBackup(data), backupFileName())
    if (saved) {
      saveLastBackup(today())
      setLastBackup(today())
    }
  }

  async function importFile(event) {
    const file = event.target.files[0]
    event.target.value = '' // so picking the same file again still works
    if (!file) return

    try {
      const backup = readBackup(await file.text())
      const sure = window.confirm(
        `Replace your ${countOf(data)} with the ${countOf(backup)} in this file? ` +
          'This removes your current list.',
      )
      if (!sure) return
      onImport(backup)
      setMessage(`Imported ${countOf(backup)}.`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div>
      <header className="screen-header">
        <button className="link" onClick={onBack}>
          ‹ Restaurants
        </button>
      </header>

      <h1>Backup</h1>
      <p className="result-meta">
        Your list is stored only on this device. Export a copy and keep it somewhere else, like
        iCloud Drive.
      </p>
      <p className="result-meta">
        {lastBackup ? `Last backup: ${timeAgo(lastBackup)}` : 'No backup from this device yet'}
      </p>

      <div className="detail-actions">
        <button className="primary big" onClick={exportList} disabled={data.restaurants.length === 0}>
          Export
        </button>
        <label className="secondary big file-button">
          Import
          <input type="file" accept=".json,application/json" onChange={importFile} />
        </label>
        {message && <p className="hint centered">{message}</p>}
      </div>

      {unreadable && (
        <div className="unreadable">
          <p className="hint">
            The app once couldn't read its saved list, so it kept a copy of the unreadable data.
          </p>
          <button
            className="link"
            onClick={() => saveFile(unreadable, 'restaurant-picker-unreadable-data.json')}
          >
            Save that copy to a file
          </button>
        </div>
      )}
    </div>
  )
}

function countOf({ restaurants, visits }) {
  return `${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurants'} and ${
    visits.length
  } ${visits.length === 1 ? 'visit' : 'visits'}`
}
