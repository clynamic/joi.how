import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { debounce } from 'lodash'
import type { FunctionComponent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import reactGA from '../../../../analytics'
import { Blacklist } from '../../../../helpers/blacklist'
import { type Credentials, type PornList } from '../../../gameboard/types'
import { type E621Post, type E621User } from '../../types'
import '../settings.css'
import './PornSetting.css'
import { PornThumbnail } from './PornThumbnail'

interface IPornSettingProps {
  credentials?: Credentials
  setCredentials: (newCredentials?: Credentials) => void
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
  const [highRes, setHighRes] = useState(false)
  const [blacklist, setBlacklist] = useState<string | undefined>()

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

  const updateMinScoreEnabled = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMinScore(event.target.checked ? 0 : undefined)
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
      setHighRes(event.target.checked)
    },
    [setHighRes],
  )

  const updateBlacklistEnabled = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setBlacklist(event.target.checked ? '' : undefined)
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
    const encodedTags = encodeURIComponent(tags + (minScore ? ` score:>=${minScore}` : ''))
    void axios
      .get(`https://e621.net/posts.json?tags=${encodedTags}&limit=${count}&callback=callback`, config)
      .then((response: AxiosResponse<{ posts: E621Post[] }>) => {
        props.setPorn(
          (
            response.data.posts
              .filter((post) => /(jpg|png|bmp|jpeg|webp|gif)$/g.test(post.file.ext))
              .filter(_blacklist.shouldKeepPost)
              .map((post) => (highRes ? post.file.url : post.sample.url))
              .filter((url) => url !== null) as string[]
          )
            .filter((url) => !props.porn.includes(url))
            .concat(props.porn),
        )
      })
  }, [blacklist, count, highRes, minScore, props, tags])

  const clear = useCallback(() => {
    props.setPorn([])
  }, [props])

  const clearOne = useCallback(
    (image: string) => {
      props.setPorn(props.porn.filter((porn) => porn !== image))
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
          {props.credentials !== undefined ? (
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
            <input type="checkbox" checked={blacklist !== undefined} onChange={updateBlacklistEnabled} />
          </label>
          {blacklist !== undefined && (
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
                {props.credentials !== undefined ? <button onClick={loadBlacklist}>Reload user blacklist</button> : null}
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
                <input type="range" min="-10" max="1000" step="10" value={minScore ?? 0} onChange={updateMinScore} />
              </label>
              <span>
                ≥<strong> {minScore}</strong>
              </span>
            </>
          )}
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
            <input type="checkbox" checked={highRes} onChange={updateHighRes} />
            <i className="emoji-icon">{highRes ? '🦄' : '🐴'}</i>
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
                <PornThumbnail key={porn} image={porn} onDelete={clearOne} />
              ))}
            </div>
          </div>
        )}
      </div>
    </fieldset>
  )
}
