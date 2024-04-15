import { type PornItem, type Credentials, type PornList, PornQuality, type PornService } from '../../../gameboard/types'
import { E621PornSetting } from './E621PornSetting'
import { PornThumbnail } from './PornThumbnail'
import type { FunctionComponent } from 'react'
import { useCallback, useState } from 'react'
import './PornSetting.css'
import '../settings.css'

export interface IPornSettingProps {
  credentials?: Credentials
  setCredentials: (service: PornService, credentials?: Credentials[PornService]) => void
  pornQuality: PornQuality
  setPornQuality: (newQuality: PornQuality) => void
  porn: PornList
  setPorn: (newPornList: PornList) => void
}

export const PornSetting: FunctionComponent<IPornSettingProps> = (props) => {
  const [selectedTab, setSelectedTab] = useState(1)
  const { setPornQuality } = props

  const updateHighRes = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPornQuality(event.target.checked ? PornQuality.HIGH : PornQuality.LOW)
    },
    [setPornQuality],
  )

  const clear = useCallback(() => {
    props.setPorn([])
  }, [props])

  const clearOne = useCallback(
    (porn: PornItem) => {
      props.setPorn(
        props.porn.filter(({ service, uniqueId }) => porn.service !== service || (porn.service === service && porn.uniqueId !== uniqueId)),
      )
    },
    [props],
  )

  return (
    <fieldset className="settings-group">
      <legend>Porn</legend>
      <div className="settings-row">
        <div className="PornSetting__services">
          <div className="PornSetting__service_tabs">
            <button
              className={`PornSetting__service_tab ${selectedTab === 1 && 'PornSetting__service_tab--selected'}`}
              onClick={() => setSelectedTab(1)}
            >
              <strong>E621</strong>
            </button>
          </div>

          <div className="PornSetting__service_tab_content">{selectedTab === 1 && <E621PornSetting {...props} />}</div>
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Use high-res images/videos</span>
            <input type="checkbox" checked={props.pornQuality === PornQuality.HIGH} onChange={updateHighRes} />
            <i className="emoji-icon">{props.pornQuality === PornQuality.HIGH ? '🦄' : '🐴'}</i>
          </label>
        </div>

        {props.porn.length > 0 && (
          <div className="settings-innerrow PornSetting__count-row">
            <button onClick={clear}>Clear All</button>
            <span>
              <strong>{props.porn.length} items</strong> stored. Click thumbnail to delete.
            </span>
            <div className="PornSetting__thumbnails">
              {props.porn.map((porn) => (
                <PornThumbnail key={`${porn.service}-${porn.uniqueId}`} porn={porn} onDelete={clearOne} />
              ))}
            </div>
          </div>
        )}
      </div>
    </fieldset>
  )
}
