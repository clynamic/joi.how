import React from 'react'
import '../settings.css'
import { useGA } from '../useGA'

interface IDurationSettingProps {
  duration: number
  setDuration: (newDuration: number) => void
}

function parseDuration(paceString: string) {
  try {
    return parseFloat(paceString)
  } catch (e) {
    return 0
  }
}

export function DurationSetting(props: IDurationSettingProps) {
  useGA('Duration', props, ['duration'])

  return (
    <fieldset className="settings-group">
      <legend>Duration</legend>
      <div className="settings-row">
        <label>
          <span>Session Duration</span>
          <input
            type="range"
            min="1300"
            max="20000"
            step="50"
            value={props.duration}
            onChange={e => props.setDuration(parseDuration(e.target.value))}
          />
        </label>
        <span>
          <strong>{Math.ceil(props.duration / 10 / 60)}min</strong>
        </span>
      </div>
    </fieldset>
  )
}
