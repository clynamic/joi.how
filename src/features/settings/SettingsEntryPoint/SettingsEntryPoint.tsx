import { type FunctionComponent } from 'react'
import { useDispatch } from 'react-redux'
import { Icon } from '../../../helpers/Icon'
import { SettingsActions } from '../store'
import './SettingsEntryPoint.css'

export const SettingsEntryPoint: FunctionComponent = () => {
  const dispatch = useDispatch()

  return (
    <button
      className="SettingsEntryPoint"
      onClick={() => dispatch(SettingsActions.OpenDialog())}
      tabIndex={1}
      aria-label="Open the settings dialog to change settings for the current game"
    >
      <Icon icon="Settings" className="SettingsEntryPoint__icon" />
    </button>
  )
}
