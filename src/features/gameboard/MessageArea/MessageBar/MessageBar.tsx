import React from 'react'
import { Message } from '../MessageTypes'
import './MessageBar.css'
import { playTone } from '../../sound'

interface IMessageProps {
  message: Message
}
export class MessageBar extends React.Component<IMessageProps> {
  componentDidMount() {
    playTone(200)
  }

  render() {
    return <div className={`MessageBar MessageBar--${this.getBarModifier(this.props.message.type)}`}>{this.props.message.text}</div>
  }

  getBarModifier(type: Message['type']) {
    /*switch (type) {
      case MessageType.EventDescription:
        return 'event-description'
      case MessageType.NewEvent:
        return 'event-will-happen'
    }*/
    return 'event-description'
  }
}
