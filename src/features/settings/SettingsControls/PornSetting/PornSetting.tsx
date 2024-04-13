import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { debounce } from 'lodash'
import type { FunctionComponent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import reactGA from '../../../../analytics'
import { Blacklist } from '../../../../helpers/blacklist'
import { type PornItem, PornService, PornType, type Credentials, type PornList, PornQuality } from '../../../gameboard/types'
import { type E621Post, type E621User, E621SortOrder } from '../../types'
import '../settings.css'
import './PornSetting.css'
import { PornThumbnail } from './PornThumbnail'

interface IPornSettingProps {
  credentials?: Credentials
  setCredentials: (newCredentials?: Credentials) => void
  pornQuality: PornQuality
  setPornQuality: (newQuality: PornQuality) => void
  porn: PornList
  setPorn: (newPornList: PornList) => void
}

export const PornSetting: FunctionComponent<IPornSettingProps> = (props) => {
  const [showCredentials, setShowCredentials] = useState(false)
  const [username, setUsername] = useState<string | undefined>()
  const [password, setPassword] = useState<string | undefined>()
  const [credentialsError, setCredentialsError] = useState<string | undefined>()
  const [tags, setTags] = useState<string>('')
  const [count, setCount] = useState(30)
  const [minScore, setMinScore] = useState<number | undefined>()
  const [sortOrder, setSortOrder] = useState<E621SortOrder>(E621SortOrder.Id)
  const [blacklist, setBlacklist] = useState<string | undefined>()
  const {setPornQuality} = props;


  const loadBlacklist = useCallback(() => {
    if (username == null || password == null) return
    const config: AxiosRequestConfig = {
      params: { login: username, api_key: password },
      responseType: 'json',
    }
    void axios.get(`https://e621.net/users/${username}.json`, config).then((response: AxiosResponse<E621User>) => {
      setBlacklist(response.data.blacklisted_tags)
    })
  }, [password, username, setBlacklist])

  useEffect(() => {
    if (props.credentials != null) {
      setUsername(props.credentials.username)
      setPassword(props.credentials.password)
      loadBlacklist()
    }
  }, [setUsername, setPassword, props.credentials, loadBlacklist])

  const updateUsername = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setUsername(event.target.value)
      setCredentialsError(undefined)
    },
    [setUsername, setCredentialsError],
  )

  const updatePassword = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value)
      setCredentialsError(undefined)
    },
    [setPassword, setCredentialsError],
  )

  const saveCredentials = useCallback(() => {
    if (username == null || password == null) return
    const config: AxiosRequestConfig = {
      params: { login: username, api_key: password },
      responseType: 'json',
    }
    axios
      .get(`https://e621.net/users/${username}.json`, config)
      .then(() => {
        props.setCredentials({ username, password })
      })
      .catch(() => {
        setCredentialsError('Invalid credentials')
      })
  }, [password, props, username])

  const clearCredentials = useCallback(() => {
    props.setCredentials(undefined)
    setShowCredentials(false)
  }, [props])

  const updateShowCredentials = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowCredentials(event.target.checked)
    },
    [setShowCredentials],
  )

  const updateTags = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTags(event.target.value)
    },
    [setTags],
  )

  const updateCount = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCount(parseInt(event.target.value))
    },
    [setCount],
  )

  const updateSortOrder = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSortOrder(event.target.value as E621SortOrder)
    },
    [setSortOrder],
  )

  const updateMinScoreEnabled = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMinScore(!event.target.checked ? undefined : -10)
    },
    [setMinScore],
  )

  const updateMinScore = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMinScore(parseInt(event.target.value))
    },
    [setMinScore],
  )

  const updateHighRes = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPornQuality(event.target.checked ? PornQuality.HIGH : PornQuality.LOW)
    },
    [setPornQuality],
  )

  const updateBlacklistEnabled = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setBlacklist(!event.target.checked ? undefined : '')
    },
    [setBlacklist],
  )

  const updateBlacklist = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBlacklist(event.target.value)
    },
    [setBlacklist],
  )

  const downloadFromTags = useCallback(() => {
    debounce(() => {
      if (localStorage.getItem('allowCookies') !== 'true' || localStorage.getItem('allowCookies') !== null) return
      reactGA.event({
        category: 'Tags',
        action: `Changed tags`,
        label: tags,
      })
    }, 2000)()

    const config: AxiosRequestConfig = { responseType: 'json' }
    if (props.credentials != null) {
      config.params = { login: props.credentials.username, api_key: props.credentials.password }
    }

    const _blacklist = new Blacklist(blacklist ?? '')
    const encodedTags = encodeURIComponent(`${tags} ${sortOrder} ${minScore ? ` score:>=${minScore}` : ''}`)
    void axios
      .get(`https://e621.net/posts.json?tags=${encodedTags}&limit=${count}`, config)
      .then((response: AxiosResponse<{ posts: E621Post[] }>) => {
        props.setPorn(
          (
            response.data.posts
              .filter((post) => /(jpg|png|bmp|jpeg|webp|gif|webm)$/g.test(post.file.ext))
              .filter(_blacklist.shouldKeepPost)
              .map((post) => ({
                previewUrl: post.preview.url,
                hoverPreviewUrl: post.file.ext === 'webm' ? post.sample?.alternates?.['480p']?.urls?.[0] ?? post.sample?.alternates?.['480p']?.urls?.[1] ?? post.file.url : post.sample.url,
                mainUrl: post.file.ext === 'webm' ? post.sample?.alternates?.['480p']?.urls?.[0] ?? post.sample?.alternates?.['480p']?.urls?.[1] ?? post.file.url : post.sample.url,
                highResUrl: post.file.url,
                type: post.file.ext === 'webm' ? PornType.VIDEO : post.file.ext === 'gif' ? PornType.GIF : PornType.IMAGE,
                source: `https://e621.net/post/index/1/md5:${post.file.md5}`,
                service: PornService.E621,
                uniqueId: String(post.id)
              }))
              .filter(({mainUrl}) => mainUrl !== null) as PornList
          )
            .filter(({service, uniqueId}) => !props.porn.find((item) => item.service === service && item.uniqueId === uniqueId))
            .concat(props.porn),
        )
      })
  }, [blacklist, count, minScore, sortOrder, props, tags])

  const clear = useCallback(() => {
    props.setPorn([])
  }, [props])

  const clearOne = useCallback(
    (porn: PornItem) => {
      props.setPorn(props.porn.filter(({service, uniqueId}) => porn.service !== service || (porn.service === service && porn.uniqueId !== uniqueId)))
    },
    [props],
  )

  return (
    <fieldset className="settings-group">
      <legend>Porn</legend>
      <div className="settings-row">
        <div className="settings-innerrow">
          <label>
            <span>Import tags</span>
            <input type="text" value={tags} onChange={updateTags} />
          </label>
          <button onClick={downloadFromTags}>Import from e621</button>
        </div>

        <div className="settings-innerrow">
          {props.credentials != null ? (
            <>
              <label>
                <span>Use user credentials</span>
                <input type="checkbox" checked onChange={clearCredentials} />
              </label>
              <br />
              <em>
                Logged in.
                <br />
                You can now use votedup:me, private sets, &amp; your blacklist.
              </em>
            </>
          ) : (
            <>
              <label>
                <span>Use user credentials</span>
                <input type="checkbox" checked={showCredentials} onChange={updateShowCredentials} />
              </label>
              <em>Login to use votedup:me, private sets, &amp; your blacklist.</em>
              {showCredentials && (
                <>
                  <label>
                    <span>Username</span>
                    <input type="text" value={username} onChange={updateUsername} />
                  </label>
                  <br />
                  <br />
                  <label>
                    <span>Api Key</span>
                    <input type="text" value={password} onChange={updatePassword} />
                  </label>
                  <em>
                    (found in <a href="https://e621.net/users/home">your account</a> under &quot;Manage API Access&quot;)
                  </em>
                  <button onClick={saveCredentials}>Save credentials</button>
                  {credentialsError != null ? <span className="PornSetting__error">{credentialsError}</span> : null}
                </>
              )}
            </>
          )}
        </div>
        <div className="settings-innerrow">
          <label>
            <span>Use blacklist</span>
            <input type="checkbox" checked={blacklist != null} onChange={updateBlacklistEnabled} />
          </label>
          {blacklist != null && (
            <>
              <br />
              <br />
              <label>
                <span>Blacklisted tags</span>
                <textarea className="PornSetting__textarea" value={blacklist ?? ''} onChange={updateBlacklist}></textarea>
                <em>
                  Put any tag combinations you don&apos;t want to see. Each combination should go on a separate line. &nbsp;
                  <a href="https://e621.net/help/blacklist">View help</a>.
                </em>
                {props.credentials != null ? <button onClick={loadBlacklist}>Reload user blacklist</button> : null}
              </label>
            </>
          )}
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Score filtering</span>
            <input type="checkbox" checked={minScore !== undefined} onChange={updateMinScoreEnabled} />
          </label>
          {minScore !== undefined && (
            <>
              <br />
              <br />
              <label>
                <span>Minimum score</span>
                <input type="range" min="-10" max="1000" step="10" value={minScore} onChange={updateMinScore} />
              </label>
              <span>
                ≥<strong> {minScore}</strong>
              </span>
            </>
          )}
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Sort order</span>
            <select onChange={updateSortOrder}>
              <option value={E621SortOrder.Id} selected={sortOrder === E621SortOrder.Id}>Id</option>
              <option value={E621SortOrder.HighestScore} selected={sortOrder === E621SortOrder.HighestScore}>Highest Score</option>
              <option value={E621SortOrder.LowestScore} selected={sortOrder === E621SortOrder.LowestScore}>Lowest Score</option>
              <option value={E621SortOrder.MostComments} selected={sortOrder === E621SortOrder.MostComments}>Most Comments</option>
              <option value={E621SortOrder.MostFavourites} selected={sortOrder === E621SortOrder.MostFavourites}>Most Favourites</option>
              <option value={E621SortOrder.VideoDurationLongest} selected={sortOrder === E621SortOrder.VideoDurationLongest}>Video Duration Longest</option>
              <option value={E621SortOrder.VideoDurationShortest} selected={sortOrder === E621SortOrder.VideoDurationShortest}>Video Duration Shortest</option>
              <option value={E621SortOrder.Random} selected={sortOrder === E621SortOrder.Random}>Random</option>
            </select>
          </label>
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Number to fetch</span>
            <input type="range" min="1" max="150" step="1" value={count} onChange={updateCount} />
          </label>
          <span>
            <strong>{count}</strong> posts
          </span>
        </div>

        <div className="settings-innerrow">
          <label>
            <span>Fetch in high-res</span>
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
