// The small floating menu that opens from the Version tab, for switching
// between the two designs of the Pick screen.

const VERSIONS = [
  { id: '1', name: 'Version 1', detail: 'Sideways cards, Pick for us button' },
  { id: '2', name: 'Version 2', detail: 'Vertical cards, swipe to pick' },
]

export default function VersionMenu({ version, onChoose, onClose }) {
  return (
    // A see-through layer over the whole screen: tapping anywhere outside the
    // menu closes it.
    <div className="menu-backdrop" onClick={onClose}>
      <div className="version-menu" role="menu" onClick={(event) => event.stopPropagation()}>
        {VERSIONS.map((v) => (
          <button
            key={v.id}
            role="menuitemradio"
            aria-checked={version === v.id}
            className={version === v.id ? 'version-option selected' : 'version-option'}
            onClick={() => onChoose(v.id)}
          >
            <span className="version-name">
              {v.name} {version === v.id && '✓'}
            </span>
            <span className="version-detail">{v.detail}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
