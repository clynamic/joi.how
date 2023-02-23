import { useEffect, type FunctionComponent } from 'react'
import { formatMessage } from '../../../../helpers/parseString'
import { type ISettingsState } from '../../../settings/store'
import { playTone } from '../../sound'
import { type Message } from '../MessageTypes'
import './MessageBar.css'

interface IMessageProps {
  message: Message
  settings: ISettingsState
}

export const MessageBar: FunctionComponent<IMessageProps> = ({ message, settings }) => {
  useEffect(() => {
    playTone(200)
  }, [])

  const getBarModifier = (): string => {
    // switch (type) {
    //    case MessageType.EventDescription:
    //        return 'event-description'
    //    case MessageType.NewEvent:
    //        return 'event-will-happen'
    // }
    return 'event-description'
  }

  return <div className={`MessageBar MessageBar--${getBarModifier()}`}>{formatMessage(message.text, settings)}</div>
}
