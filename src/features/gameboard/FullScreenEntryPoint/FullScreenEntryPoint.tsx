import { type FunctionComponent } from 'react'
import { Icon } from '../../../helpers/Icon'
import './FullScreenEntryPoint.css'

export const FullScreenEntryPoint: FunctionComponent = () => {
  return (
    <button
      className="FullScreenEntryPoint"
      onClick={() => {
        if (document.fullscreenElement !== null) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }}
      tabIndex={2}
      aria-label="Make game fullscreen"
    >
      <Icon icon="Expand" className="FullScreenEntryPoint__icon" />
    </button>
  )
}
