import { type FunctionComponent } from 'react'
import { events } from '../../../gameboard'
import { type EventToken } from '../../../gameboard/types'
import '../settings.css'
import { useGA } from '../useGA'

interface IEventsSettingProps {
  eventList: Array<EventToken['id']>
  setEventList: (newEvents: Array<EventToken['id']>) => void
}

function toggle(props: IEventsSettingProps, eventToken: EventToken): void {
  const currentlyEnabled = isEnabled(props, eventToken)

  if (currentlyEnabled) {
    props.setEventList(props.eventList.filter((eventTokenId) => eventTokenId !== eventToken.id))
  } else {
    props.setEventList(props.eventList.concat([eventToken.id]))
  }
}

const isEnabled = (props: IEventsSettingProps, eventToken: EventToken): boolean => {
  return props.eventList.find((eventTokenId) => eventTokenId === eventToken.id) != null
}

export const EventsSetting: FunctionComponent<IEventsSettingProps> = (props) => {
  useGA('Events', props, ['eventList'])

  return (
    <fieldset className="settings-group">
      <legend>Events</legend>
      <div className="settings-row">
        <strong>Click to enable/disable occurance of each event.</strong>
        {events.map((event) => (
          <button
            className={`settings-option${isEnabled(props, event) ? '--enabled' : '--disabled'}`}
            onClick={() => {
              toggle(props, event)
            }}
            role="switch"
            aria-checked={isEnabled(props, event)}
            key={event.id}
          >
            <strong>{event.name}</strong>
            <span>{event.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
