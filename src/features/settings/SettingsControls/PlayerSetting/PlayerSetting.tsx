import '../settings.css'
import { PlayerGender, PlayerParts } from '../../../gameboard/types'
import { useGA } from '../useGA'

interface IPlayerSettingProps {
  gender: PlayerGender
  parts: PlayerParts
  setParts: (newMode: PlayerParts) => void
  setGender: (newGender: PlayerGender) => void
}

const PLAYER_GENDER_TYPES = [
  { gender: PlayerGender.Female, name: 'Female', description: 'Refer to you as a female. (she/her/girl)' },
  { gender: PlayerGender.Male, name: 'Male', description: 'Refer to you as a male. (he/him/boy)' },
  { gender: PlayerGender.Neutral, name: 'Neutral', description: 'Refer to you neutrally. (pup)' },
]

const PLAYER_PARTS_TYPES = [
  { parts: PlayerParts.Cock, name: 'Cock', description: 'You have a cock.' },
  { parts: PlayerParts.Pussy, name: 'Pussy', description: 'You have a pussy.' },
  { parts: PlayerParts.Neuter, name: 'Neuter', description: 'You have neither.' },
]

export function PlayerSetting(props: IPlayerSettingProps) {
  useGA('Player', props, ['gender', 'parts'])

  return (
    <fieldset className="settings-group">
      <legend>Player</legend>
      <div className="settings-row" role="radiogroup" id="gender">
        <strong>Select to set player gender.</strong>
        {PLAYER_GENDER_TYPES.map((modeType) => (
          <button
            name="gender"
            className={`settings-option${props.gender === modeType.gender ? '--enabled' : '--disabled'}`}
            onClick={() => props.setGender(modeType.gender)}
            role="radio"
            aria-checked={props.gender === modeType.gender}
            key={modeType.gender}
          >
            <strong>{modeType.name}</strong>
            <span>{modeType.description}</span>
          </button>
        ))}
      </div>
      <div className="settings-row" role="radiogroup" id="parts">
        <strong>Select to set player parts.</strong>
        {PLAYER_PARTS_TYPES.map((modeType) => (
          <button
            name="parts"
            className={`settings-option${props.parts === modeType.parts ? '--enabled' : '--disabled'}`}
            onClick={() => props.setParts(modeType.parts)}
            role="radio"
            aria-checked={props.parts === modeType.parts}
            key={modeType.parts}
          >
            <strong>{modeType.name}</strong>
            <span>{modeType.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
