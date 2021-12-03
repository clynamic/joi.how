import React, { PropsWithChildren } from 'react'
import '../settings.css'
import { VibrationStyleMode } from '../../store'
import { Vibrator } from '../../../../services/vibrator'

interface ILovenseSettingProps {
  vibrator: Vibrator | null
  mode: VibrationStyleMode
  setMode: (newMode: VibrationStyleMode) => void
  onConnect: () => void
  onDisconnect: () => void
  error: Error | null
}

const VIBRATION_STYLE_MODES = [
  { mode: VibrationStyleMode.CONSTANT, name: 'Constantly On', description: 'Vibration intensity changes based on stroke pace.' },
  { mode: VibrationStyleMode.THUMP, name: 'Thump', description: 'Vibration thumps with the stroke pace.' },
]

const Wrapper = (props: PropsWithChildren<{}>) => (
  <fieldset className="settings-group">
    <legend>Vibrator</legend>
    <div className="settings-row">
      <strong>Connect any compatible device to your game.</strong>
      <em>This requires a browser that supports WebBluetooth. Use Chrome.</em>
      {props.children}
    </div>
  </fieldset>
)

export function VibratorSetting(props: ILovenseSettingProps) {
  if (props.vibrator) {
    return (
      <Wrapper>
        <div className="settings-innerrow">
          <button onClick={props.onDisconnect}>Disconnect</button>
        </div>
        <div className="settings-innerrow">
          <em>Connected to {props.vibrator.name}</em>
          {VIBRATION_STYLE_MODES.map(modeType => (
            <button
              className={`settings-option${props.mode === modeType.mode ? '--enabled' : '--disabled'}`}
              onClick={() => props.setMode(modeType.mode)}
              role="radio"
              aria-checked={props.mode === modeType.mode}
              key={modeType.mode}>
              <strong>{modeType.name}</strong>
              <span>{modeType.description}</span>
            </button>
          ))}
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="settings-innerrow">
        <button onClick={props.onConnect}>Connect</button>
      </div>
    </Wrapper>
  )
}
