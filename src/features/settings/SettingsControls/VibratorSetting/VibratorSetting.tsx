import { type FunctionComponent, type PropsWithChildren } from 'react'
import { type Vibrator } from '../../../../services/vibrator'
import { VibrationStyleMode } from '../../store'
import '../settings.css'

interface IVibratorSettingProps {
  connection: string | null
  vibrators: Vibrator[]
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

const Wrapper: FunctionComponent<PropsWithChildren> = (props) => (
  <fieldset className="settings-group">
    <legend>Vibrator</legend>
    <div className="settings-row">
      <strong>Connect any compatible device to your game.</strong>
      <em>
        This requires you to install{' '}
        <a href="https://intiface.com/central/" target={'_blank'} rel="noreferrer">
          intiface central
        </a>
        .
      </em>
      {props.children}
    </div>
  </fieldset>
)

export const VibratorSetting: FunctionComponent<IVibratorSettingProps> = (props) => {
  if (props.connection != null) {
    return (
      <Wrapper>
        <div className="settings-innerrow">
          <button onClick={props.onDisconnect}>Disconnect</button>
        </div>
        <div className="settings-innerrow">
          <em>Connected to {props.connection}</em>
          {props.vibrators.length > 0 ? (
            <>
              Using these devices:
              <ul>
                {props.vibrators.map((e) => (
                  <li key={e.name}>{e.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <em>Waiting for devices...</em>
          )}
          {VIBRATION_STYLE_MODES.map((modeType) => (
            <button
              className={`settings-option${props.mode === modeType.mode ? '--enabled' : '--disabled'}`}
              onClick={() => {
                props.setMode(modeType.mode)
              }}
              role="radio"
              aria-checked={props.mode === modeType.mode}
              key={modeType.mode}
            >
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
        {props.error != null ? (
          <div className="settings-row">
            <em>Failed to connect! Is your intiface server running?</em>
          </div>
        ) : null}
      </div>
    </Wrapper>
  )
}
