import React from 'react'
import '../settings.css'
import { HypnoMode } from '../../../gameboard/types'
import { useGA } from '../useGA'

interface IHypnoSettingProps {
  mode: HypnoMode
  setMode: (newMode: HypnoMode) => void
}

const HYPNO_MODE_TYPES = [
  { mode: HypnoMode.Off, name: 'Off', description: 'Turn off the hypnosis all-together.' },
  { mode: HypnoMode.JOI, name: 'JOI', description: 'Focus on masturbation encouragement.' },
  { mode: HypnoMode.Breeding, name: 'Breeding', description: 'Focus on breeding and primal urge.' },
  { mode: HypnoMode.Pet, name: 'Maledom Pet', description: "Good boys get master's treats." },
  { mode: HypnoMode.FemDomPet, name: 'Femdom Pet', description: "Good boys get mistress' treats." },
]

export function HypnoSetting(props: IHypnoSettingProps) {
  useGA('Hypno', props, ['mode'])

  return (
    <fieldset className="settings-group">
      <legend>Hypno</legend>
      <div className="settings-row" role="radiogroup">
        <strong>Select to enable a hypno spinner text set.</strong>
        {HYPNO_MODE_TYPES.map(modeType => (
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
    </fieldset>
  )
}
