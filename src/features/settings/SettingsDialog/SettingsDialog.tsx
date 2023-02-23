import { useEffect, type FunctionComponent } from 'react'
import { type IState } from '../../../store'

import { useDispatch, useSelector } from 'react-redux'
import { SettingsControls } from '../SettingsControls/SettingsControls'
import { SettingsActions } from '../store'
import './SettingsDialog.css'

export const SettingsDialog: FunctionComponent = () => {
  const dialogShown = useSelector<IState, IState['settings']['dialogShown']>((state) => state.settings.dialogShown)
  const dispatch = useDispatch()

  const dismiss = (): void => {
    void dispatch(SettingsActions.CloseDialog())
  }

  const escapePress = (event: KeyboardEvent): void => {
    if (event.keyCode === 27) {
      dismiss()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', escapePress, false)

    return () => {
      document.removeEventListener('keydown', escapePress, false)
    }
  }, [])

  return (
    <>
      <div
        className={`SettingsDialog__dim SettingsDialog__dim--${dialogShown ? 'shown' : 'hidden'}`}
        onClick={dismiss}
        role="presentation"
      />
      <div
        className={`SettingsDialog SettingsDialog--${dialogShown ? 'shown' : 'hidden'}`}
        role="dialog"
        aria-label="Settings Dialog"
        hidden={!dialogShown}
        tabIndex={dialogShown ? 0 : -1}
      >
        <div className="SettingsDialog__content">
          <section className="settings-row">
            <p>
              Press <strong>escape</strong> to close, or click outside the dialog box. These settings affect the current game, and it
              continues to run while you adjust these.
            </p>
          </section>
          <SettingsControls />
        </div>
      </div>
    </>
  )
}
