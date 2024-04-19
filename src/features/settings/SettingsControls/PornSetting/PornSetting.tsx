import { type PornItem, type Credentials, type PornList, PornQuality, PornService } from '../../../gameboard/types'
import { LocalFilesPornSetting } from './LocalFilesPornSetting'
import { E621PornSetting } from './E621PornSetting'
import { PornThumbnail } from './PornThumbnail'
import type { FunctionComponent } from 'react'
import { useCallback, useState } from 'react'
import './PornSetting.css'

export interface IPornSettingProps {
  credentials?: Credentials
  setCredentials: (service: PornService, credentials?: Credentials[PornService]) => void
  pornQuality: PornQuality
  setPornQuality: (newQuality: PornQuality) => void
  startVideosAtRandomTime: boolean
  setStartVideosAtRandomTime: (randomStart: boolean) => void
  videosMuted: boolean
  setVideosMuted: (videosMuted: boolean) => void
  porn: PornList
  setPorn: (newPornList: PornList) => void
}

export const PornSetting: FunctionComponent<IPornSettingProps> = (props) => {
  const [selectedTab, setSelectedTab] = useState(PornService.E621)
  const { setPornQuality, setStartVideosAtRandomTime, setVideosMuted } = props

  const updateHighRes = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPornQuality(event.target.checked ? PornQuality.HIGH : PornQuality.LOW)
    },
    [setPornQuality],
  )

  const updateStartVideosAtRandomTime = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setStartVideosAtRandomTime(event.target.checked)
    },
    [setStartVideosAtRandomTime],
  )

  const updateVideosMuted = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setVideosMuted(event.target.checked)
    },
    [setVideosMuted],
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
              className={`PornSetting__service_tab ${selectedTab === PornService.E621 ? 'PornSetting__service_tab--selected' : ''}`}
              onClick={() => setSelectedTab(PornService.E621)}
            >
              <strong>E621</strong>
            </button>

            <button
              className={`PornSetting__service_tab ${selectedTab === PornService.LOCAL ? 'PornSetting__service_tab--selected' : ''}`}
              onClick={() => setSelectedTab(PornService.LOCAL)}
            >
              <strong>Local Files</strong>
            </button>
          </div>

          <div className="PornSetting__service_tab_content">
            {selectedTab === PornService.E621 && <E621PornSetting {...props} />}
            {selectedTab === PornService.LOCAL && <LocalFilesPornSetting {...props} />}
          </div>
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Use high-res images/videos</span>
            <input type="checkbox" checked={props.pornQuality === PornQuality.HIGH} onChange={updateHighRes} />
            <i className="emoji-icon">{props.pornQuality === PornQuality.HIGH ? '🦄' : '🐴'}</i>
          </label>
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Start videos at random time</span>
            <input type="checkbox" checked={props.startVideosAtRandomTime} onChange={updateStartVideosAtRandomTime} />
          </label>
          <br />
          <label>
            <span>Mute Videos</span>
            <input type="checkbox" checked={props.videosMuted} onChange={updateVideosMuted} />
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
                <PornThumbnail key={`${porn.service}-${porn.uniqueId}`} porn={porn} videosMuted={props.videosMuted} onDelete={clearOne} />
              ))}
            </div>
          </div>
        )}
      </div>
    </fieldset>
  )
}
