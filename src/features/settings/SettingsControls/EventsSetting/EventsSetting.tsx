import React, { SFC } from 'react'
import '../settings.css'
import { events } from '../../../gameboard/events/index'
import { EventToken } from '../../../gameboard/types'
import { useGA } from '../useGA'

interface IEventsSettingProps {
  eventList: EventToken['id'][]
  setEventList: (newEvents: EventToken['id'][]) => void
}

function toggle(props: IEventsSettingProps, eventToken: EventToken) {
  const currentlyEnabled = isEnabled(props, eventToken)

  if (currentlyEnabled) {
    props.setEventList(props.eventList.filter(eventTokenId => eventTokenId !== eventToken.id))
  } else {
    props.setEventList(props.eventList.concat([eventToken.id]))
  }
}

const isEnabled = (props: IEventsSettingProps, eventToken: EventToken) => {
  return !!props.eventList.find(eventTokenId => eventTokenId === eventToken.id)
}

export const EventsSetting: SFC<IEventsSettingProps> = props => {
  useGA('Events', props, ['eventList'])

  return (
    <fieldset className="settings-group">
      <legend>Events</legend>
      <div className="settings-row">
        <strong>Click to enable/disable occurance of each event.</strong>
        {events.map(event => (
          <button
            className={`settings-option${isEnabled(props, event) ? '--enabled' : '--disabled'}`}
            onClick={() => toggle(props, event)}
            role="switch"
            aria-checked={isEnabled(props, event)}
            key={event.id}>
            <strong>{event.name}</strong>
            <span>{event.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
