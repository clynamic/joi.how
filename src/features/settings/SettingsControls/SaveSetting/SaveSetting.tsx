import { useState } from 'react'
import '../settings.css'
import './SaveSetting.css'
import { ReactComponent as Warning } from '../../../../assets/warning.svg'
import { IState } from '../../../../store'
import { makeSave, unpackSave, SavePornEncodingError, SaveVersionEncodingError } from '../../../../helpers/saveFormat'

interface ISaveSettingProps {
  settings: Partial<IState['settings']>
  setSettings: (newSettings: Partial<IState['settings']>) => void
}

function prepSave(currentSave: string, setError: (msg: string | null) => void): Partial<IState['settings']> {
  let result = {}
  try {
    result = unpackSave(currentSave)
  } catch (e) {
    if (e instanceof SavePornEncodingError) setError('The porn encoding is off somehow. This is a weird error. Hmm.')
    else if (e instanceof SaveVersionEncodingError)
      setError('The code you entered is from an older version of the app, and is not compatible. Sorry.')
    else
      setError(
        'This is not a valid JOI.HOW code. Maybe check that you copied the whole thing, and that there are no whitespace characters you entered.',
      )
  }
  return result
}

export function SaveSetting(props: ISaveSettingProps) {
  const [currentSave, setCurrentSave] = useState('')
  const [error, setError] = useState(null as string | null)

  return (
    <fieldset className="settings-group">
      <legend>Save/Load</legend>
      <div className="settings-row">
        <strong>Share these codes around to let others try your settings.</strong>
        <div className="settings-innerrow">
          <em>Either copy and paste a code below and click "load", or set everything else up and hit "save" to update the code shown.</em>
          <button onClick={() => setCurrentSave(makeSave(props.settings))}>Save</button>
          <button onClick={() => props.setSettings(prepSave(currentSave, setError))}>Load</button>
        </div>
        <div className="settings-innerrow">
          <textarea className="SaveSetting__textarea" value={currentSave} onChange={(e) => setCurrentSave(e.target.value)} />
        </div>
      </div>
      {error !== null ? (
        <div className="settings-cover settings-row" role="alert">
          <Warning className="SaveSetting__erroricon" />
          <h3>Oh no.</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Go back</button>
        </div>
      ) : null}
    </fieldset>
  )
}
