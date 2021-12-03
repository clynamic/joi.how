import React from 'react'

import './PornControls.css'

interface IPornControlsProps {
  onSkip: () => void
  onOpen: () => void
}

export function PornControls(props: IPornControlsProps) {
  return (
    <div className="PornControls__wrapper settings-row" role="complementary" aria-label="Porn controls">
      <button className="settings-button" onClick={props.onSkip} tabIndex={0}>
        Skip Image
      </button>
      <button className="settings-button" onClick={props.onOpen} tabIndex={0}>
        Open Source
      </button>
    </div>
  )
}
