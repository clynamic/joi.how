import { marked } from 'marked'
import raw from 'raw.macro'
import { useState, type FunctionComponent } from 'react'
import './ReleaseNotes.css'

const releaseNotes = raw('../../../release-notes.md')

export const ReleaseNotes: FunctionComponent = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="ReleaseNotes__container">
      <button
        id="ReleaseNotes__button"
        aria-label="Toggle release note information below."
        aria-controls="ReleaseNotes__content"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
        }}
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
