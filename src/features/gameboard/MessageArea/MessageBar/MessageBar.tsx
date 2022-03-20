import React from 'react'
import { Message } from '../MessageTypes'
import { formatMessage } from '../../Player/Player'
import './MessageBar.css'
import { playTone } from '../../sound'
import { ISettingsState } from '../../../settings/store'

interface IMessageProps {
  message: Message
  settings: ISettingsState
}
export class MessageBar extends React.Component<IMessageProps> {
  componentDidMount() {
    playTone(200)
  }

  render() {
    return (
      <div className={`MessageBar MessageBar--${this.getBarModifier(this.props.message.type)}`}>
        {this.formatMessage(this.props.message)}
      </div>
    )
  }

  getBarModifier(type: Message['type']) {
    //switch (type) {
    //    case MessageType.EventDescription:
    //        return 'event-description'
    //    case MessageType.NewEvent:
    //        return 'event-will-happen'
    //}
    return 'event-description'
  }

  formatMessage(msg: Message) {
    return formatMessage(msg.text, this.props.settings)
  }
}
