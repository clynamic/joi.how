import { useState } from 'react'
import raw from 'raw.macro'
import './ReleaseNotes.css'
import { marked } from 'marked'

const releaseNotes = raw('../../../release-notes.md')

export function ReleaseNotes() {
  const [open, setOpen] = useState(false)

  return (
    <div className="ReleaseNotes__container">
      <button
        id="ReleaseNotes__button"
        aria-label="Toggle release note information below."
        aria-controls="ReleaseNotes__content"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Release Notes
      </button>
      <div
        id="ReleaseNotes__content"
        aria-hidden={!open}
        aria-labelledby="ReleaseNotes__button"
        tabIndex={open ? 0 : -1}
        dangerouslySetInnerHTML={{ __html: marked.parse(releaseNotes) }}
      />
    </div>
  )
}
