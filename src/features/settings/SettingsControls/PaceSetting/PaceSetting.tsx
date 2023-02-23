import { type FunctionComponent } from 'react'
import { Sparklines, SparklinesLine } from 'react-sparklines'
import { intensityToPaceBounds } from '../../../../helpers/intensity'
import '../settings.css'
import { useGA } from '../useGA'

interface IPaceSettingProps {
  max: number
  min: number
  steepness: number
  setMax: (newMax: number) => void
  setMin: (newMin: number) => void
  setSteepness: (newSteepness: number) => void
}

function floatToString(paceString: string): number {
  try {
    return parseFloat(paceString)
  } catch (e) {
    return 0
  }
}

function getSparklineSetForSteepness(steepness: IPaceSettingProps['steepness']): number[] {
  return Array.from(new Array(20))
    .map((_, index, array) => (index / array.length) * 100)
    .map((intensity) => {
      return intensityToPaceBounds(intensity, steepness, {
        max: 10,
        min: 0,
      })
    })
    .map((paceBounds) => {
      return paceBounds.max - 1.5
    })
}

export const PaceSetting: FunctionComponent<IPaceSettingProps> = (props) => {
  useGA('Pace', props, ['max', 'min', 'steepness'])

  return (
    <fieldset className="settings-group">
      <legend>Stroke Pace</legend>
      <div className="settings-innerrow">
        <div className="settings-row">
          <em>Pace settings are mesured in strokes per second.</em>
          <label>
            <span>Maximum</span>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.05"
              value={props.max}
              onChange={(e) => {
                props.setMax(floatToString(e.target.value))
              }}
            />
          </label>
          <span>
            <strong>{props.max}s</strong>/sec
          </span>
        </div>
        <div className="settings-row">
          <label>
            <span>Minimum</span>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.05"
              value={props.min}
              onChange={(e) => {
                props.setMin(floatToString(e.target.value))
              }}
            />
          </label>
          <span>
            <strong>{props.min}s</strong>/sec
          </span>
        </div>
      </div>
      <div className="settings-innerrow">
        <div className="settings-row">
          <em>How should the pace change over the course of the game?</em>
          <label>
            <span>Steepness</span>
            <input
              type="range"
              min="-0.1"
              max="0.1"
              step="0.005"
              value={props.steepness}
              onChange={(e) => {
                props.setSteepness(floatToString(e.target.value))
              }}
            />
          </label>
          <span>
            <Sparklines data={getSparklineSetForSteepness(props.steepness)} svgWidth={50} svgHeight={20} max={11} min={-1}>
              <SparklinesLine
                style={{
                  strokeWidth: 4,
                }}
              />
            </Sparklines>
          </span>
        </div>
      </div>
    </fieldset>
  )
}
