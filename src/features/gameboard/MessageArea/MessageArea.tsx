import React from 'react'
import { connect } from 'react-redux'
import { Message, isPrompt, Button } from './MessageTypes'
import { IState } from '../../../store'
import { PropsForConnectedComponent } from '../types'
import { MessageBar } from './MessageBar/MessageBar'
import { ISettingsState } from '../../settings/store'
import './MessageArea.css'
import { GameBoardActions } from '../store/actions'

interface IMessageAreaProps extends PropsForConnectedComponent {
  messages: Message[]
}

export const MessageArea = connect(
  (state: IState) =>
    ({
      messages: state.game.messages,
    } as IMessageAreaProps),
)(
  class extends React.Component<IMessageAreaProps> {
    runButtonMethod(button: Button) {
      const returnValue = button.method()
      if (returnValue) {
        this.props.dispatch(GameBoardActions.PauseEvents())
        returnValue.then(() => this.props.dispatch(GameBoardActions.ResumeEvents()))
      }
    }

    render() {
      return (
        <div className="MessageArea">
          <div className="MessageArea__messages" role="alert">
            {this.props.messages.map(message => (
              <MessageBar key={message.text} message={message} />
            ))}
          </div>
          <div className="MessageArea__prompt settings-row">
            {this.props.messages
              .filter(isPrompt)
              .slice(0, 1)
              .reduce((acc, message) => message.buttons, [] as Button[])
              .map(button => {
                return (
                  <button className="settings-button" onClick={() => this.runButtonMethod(button)} key={button.display}>
                    {button.display}
                  </button>
                )
              })}
          </div>
        </div>
      )
    }
  },
)
