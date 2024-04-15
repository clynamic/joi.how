import { type FunctionComponent } from 'react'

import './PornControls.css'

interface IPornControlsProps {
  onSkip: () => void
  onOpen?: () => void
}

export const PornControls: FunctionComponent<IPornControlsProps> = ({ onSkip, onOpen }) => {
  return (
    <div className="PornControls__wrapper settings-row" role="complementary" aria-label="Porn controls">
      <button className="settings-button" onClick={onSkip} tabIndex={0}>
        Skip Image
      </button>
      {onOpen && (
        <button className="settings-button" onClick={onOpen} tabIndex={0}>
          Open Source
        </button>
      )}
    </div>
  )
}
