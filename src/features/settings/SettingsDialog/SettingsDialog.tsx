import React from 'react'
import { connect } from 'react-redux'
import { PropsForConnectedComponent } from '../types'
import { IState } from '../../../store'

import './SettingsDialog.css'
import { SettingsActions } from '../store'
import { SettingsControls } from '../SettingsControls/SettingsControls'

interface ISettingsDialogProps extends PropsForConnectedComponent {
  shown: boolean
}

export const SettingsDialog = connect(
  (state: IState) =>
    ({
      shown: state.settings.dialogShown,
    } as ISettingsDialogProps),
)(
  class extends React.Component<ISettingsDialogProps> {
    constructor(props: ISettingsDialogProps) {
      super(props)
      this.dismiss = this.dismiss.bind(this)
      this.escapePress = this.escapePress.bind(this)
    }

    dismiss() {
      this.props.dispatch(SettingsActions.CloseDialog())
    }

    escapePress(event: KeyboardEvent) {
      if (event.keyCode === 27) {
        this.dismiss()
      }
    }

    componentDidMount() {
      document.addEventListener('keydown', this.escapePress, false)
    }

    componentWillUnmount() {
      document.removeEventListener('keydown', this.escapePress, false)
    }

    render() {
      return (
        <>
          <div
            className={`SettingsDialog__dim SettingsDialog__dim--${this.props.shown ? 'shown' : 'hidden'}`}
            onClick={this.dismiss}
            role="presentation"
          />
          <div
            className={`SettingsDialog SettingsDialog--${this.props.shown ? 'shown' : 'hidden'}`}
            role="dialog"
            aria-label="Settings Dialog"
            hidden={!this.props.shown}
            tabIndex={this.props.shown ? 0 : -1}>
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
  },
)
