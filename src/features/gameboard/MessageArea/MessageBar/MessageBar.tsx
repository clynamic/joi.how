import React from 'react'
import { useSelector } from 'react-redux'
import { Message } from '../MessageTypes'
import { formatMessage } from '../../Player/Player'
import './MessageBar.css'
import { playTone } from '../../sound'
import { IState } from '../../../../store'

interface IMessageProps {
  message: Message
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
    let settings = useSelector<IState, IState['settings']>(state => state.settings)
    return formatMessage(msg.text, settings)
  }
}
