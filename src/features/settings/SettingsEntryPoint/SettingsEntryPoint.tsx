import React from 'react'
import './SettingsEntryPoint.css'
import { connect } from 'react-redux'
import { PropsForConnectedComponent } from '../types'
import { SettingsActions } from '../store'
import { Icon } from '../../../helpers/Icon'

interface ISettingsEntryPointProps extends PropsForConnectedComponent {}

export const SettingsEntryPoint = connect()(
  class extends React.Component<ISettingsEntryPointProps> {
    render() {
      return (
        <button
          className="SettingsEntryPoint"
          onClick={() => this.props.dispatch(SettingsActions.OpenDialog())}
          tabIndex={1}
          aria-label="Open the settings dialog to change settings for the current game">
          <Icon icon="Settings" className="SettingsEntryPoint__icon" />
        </button>
      )
    }
  },
)
