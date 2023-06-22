import { type FunctionComponent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { formatMessage } from '../../../helpers/parseString'
import { type IState } from '../../../store'
import { GameBoardActions } from '../store'
import './MessageArea.css'
import { MessageBar } from './MessageBar/MessageBar'
import { MessageType, type Button, type Message } from './MessageTypes'

export const MessageArea: FunctionComponent = () => {
  const messages = useSelector<IState, IState['game']['messages']>((state) => state.game.messages)
  const settings = useSelector<IState, IState['settings']>((state) => state.settings)
  const dispatch = useDispatch()

  const runButtonMethod = (button: Button): void => {
    const returnValue = button.method()
    if (returnValue != null) {
      dispatch(GameBoardActions.StopEvents())
      void returnValue.then(() => {
        void dispatch(GameBoardActions.StartEvents())
      })
    }
  }

  const promptButtons = messages
    .filter(isPrompt)
    .slice(0, 1)
    .reduce<Button[]>((_, message) => {
      if ('buttons' in message) {
        return message.buttons
      } else {
        return []
      }
    }, [])

  return (
    <div className="MessageArea">
      <div className="MessageArea__messages" role="alert">
        {messages.map((message) => {
          return <MessageBar key={message.text} message={message} settings={settings} />
        })}
      </div>
      <div className="MessageArea__prompt settings-row">
        {promptButtons.map((button) => {
          return (
            <button
              className="settings-button"
              onClick={() => {
                runButtonMethod(button)
              }}
              key={button.display}
            >
              {formatMessage(button.display, settings)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const isPrompt = (message: Message): boolean => {
  return message.type === MessageType.Prompt
}
