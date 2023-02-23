import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { debounce } from 'lodash'
import React, { type ReactElement } from 'react'
import reactGA from '../../../../analytics'
import { Blacklist } from '../../../../helpers/blacklist'
import { type Credentials, type PornList } from '../../../gameboard/types'
import { type E621Post, type E621User } from '../../types'
import '../settings.css'
import './PornSetting.css'
import { PornThumbnail } from './PornThumbnail'

interface IPornSettingProps {
  credentials: Credentials | null
  setCredentials: (newCredentials: Credentials | null) => void
  pornList: PornList
  setPornList: (newPornList: PornList) => void
}

interface IPornSettingState {
  tags: string
  count: number
  minScore: number | null
  flags: {
    highRes: boolean
  }
  credentials: Credentials
  addCredentials: boolean
  credentialsError: string | null
  blacklistTagsString: string | null
}

export class PornSetting extends React.Component<IPornSettingProps, IPornSettingState> {
  constructor(props: IPornSettingProps) {
    super(props)

    this.state = {
      tags: '',
      count: 30,
      minScore: null,
      flags: {
        highRes: false,
      },
      credentials: { login: '', api_key: '' },
      addCredentials: false,
      credentialsError: null,
      blacklistTagsString: null,
    }

    this.updateTags = this.updateTags.bind(this)
    this.updateLogin = this.updateLogin.bind(this)
    this.updateApiKey = this.updateApiKey.bind(this)
    this.saveCredentials = this.saveCredentials.bind(this)
    this.clearCredentials = this.clearCredentials.bind(this)
    this.loadBlacklist = this.loadBlacklist.bind(this)
    this.downloadFromTags = this.downloadFromTags.bind(this)
    this.clear = this.clear.bind(this)
  }

  componentDidUpdate(prevProps: IPornSettingProps): void {
    if (this.props.credentials !== null && prevProps.credentials === null) {
      this.setState({ credentials: this.props.credentials })
      this.loadBlacklist()
    }
  }

  updateTags(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      tags: event.target.value,
    })
  }

  updateLogin(event: React.ChangeEvent<HTMLInputElement>): void {
    const login = event.target.value
    this.setState((prevState) => ({
      credentials: {
        ...prevState.credentials,
        login,
      },
      credentialsError: null,
    }))
  }

  updateApiKey(event: React.ChangeEvent<HTMLInputElement>): void {
    const apiKey = event.target.value
    this.setState((prevState) => ({
      credentials: {
        ...prevState.credentials,
        api_key: apiKey,
      },
      credentialsError: null,
    }))
  }

  saveCredentials(): void {
    // Check to see if these credentials are valid
    const config: AxiosRequestConfig = {
      params: this.state.credentials,
      responseType: 'json',
    }
    axios
      .get(`https://e621.net/users/${this.state.credentials.login}.json`, config)
      .then(() => {
        this.props.setCredentials(this.state.credentials)
      })
      .catch(() => {
        this.setState({ credentialsError: 'Invalid credentials' })
      })
  }

  clearCredentials(): void {
    this.props.setCredentials(null)
    this.setState({ addCredentials: false })
  }

  loadBlacklist(): void {
    const config: AxiosRequestConfig = {
      params: this.props.credentials,
      responseType: 'json',
    }
    if (this.props.credentials == null) return
    void axios.get(`https://e621.net/users/${this.props.credentials.login}.json`, config).then((response: AxiosResponse<E621User>) => {
      this.setState({ blacklistTagsString: response.data.blacklisted_tags })
    })
  }

  downloadFromTags(): void {
    debounce(() => {
      if (localStorage.getItem('allowCookies') !== 'true' || localStorage.getItem('allowCookies') !== null) return
      reactGA.event({
        category: 'Tags',
        action: `Changed tags`,
        label: this.state.tags,
      })
    }, 2000)()

    const config: AxiosRequestConfig = { responseType: 'json' }
    if (this.props.credentials != null) {
      config.params = this.props.credentials
    }

    const blacklist = new Blacklist(this.state.blacklistTagsString ?? '')
    const tags = encodeURIComponent(this.state.tags + (this.state.minScore !== null ? ` score:>=${this.state.minScore}` : ''))
    void axios
      .get(`https://e621.net/posts.json?tags=${tags}&limit=${this.state.count}&callback=callback`, config)
      .then((response: AxiosResponse<{ posts: E621Post[] }>) => {
        this.props.setPornList(
          (
            response.data.posts
              .filter((post) => /(jpg|png|bmp|jpeg|webp|gif)$/g.test(post.file.ext))
              .filter(blacklist.shouldKeepPost)
              .map((post) => (this.state.flags.highRes ? post.file.url : post.sample.url))
              .filter((url) => url !== null) as string[]
          )
            .filter((url) => !this.props.pornList.includes(url))
            .concat(this.props.pornList),
        )
      })
  }

  clear(): void {
    this.props.setPornList([])
  }

  clearOne(image: string): void {
    this.props.setPornList(this.props.pornList.filter((porn) => porn !== image))
  }

  render(): ReactElement {
    return (
      <fieldset className="settings-group">
        <legend>Porn</legend>
        <div className="settings-row">
          <div className="settings-innerrow">
            <label>
              <span>Import tags</span>
              <input type="text" value={this.state.tags} onChange={this.updateTags} />
            </label>
            <button onClick={this.downloadFromTags}>Import from e621</button>
          </div>

          <div className="settings-innerrow">
            {this.props.credentials != null ? (
              <>
                <label>
                  <span>Use user credentials</span>
                  <input type="checkbox" checked onChange={this.clearCredentials} />
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
                  <input
                    type="checkbox"
                    checked={this.state.addCredentials}
                    onChange={(e) => {
                      this.setState({ addCredentials: e.target.checked })
                    }}
                  />
                </label>
                <em>Login to use votedup:me, private sets, &amp; your blacklist.</em>
                {this.state.addCredentials ? (
                  <>
                    <label>
                      <span>Username</span>
                      <input type="text" value={this.state.credentials.login} onChange={this.updateLogin} />
                    </label>
                    <br />
                    <br />
                    <label>
                      <span>Api Key</span>
                      <input type="text" value={this.state.credentials.api_key} onChange={this.updateApiKey} />
                    </label>
                    <em>
                      (found in <a href="https://e621.net/users/home">your account</a> under &quot;Manage API Access&quot;)
                    </em>
                    <button onClick={this.saveCredentials}>Save credentials</button>
                    {this.state.credentialsError != null ? <span className="PornSetting__error">{this.state.credentialsError}</span> : null}
                  </>
                ) : null}
              </>
            )}
          </div>
          <div className="settings-innerrow">
            <label>
              <span>Use blacklist</span>
              <input
                type="checkbox"
                checked={this.state.blacklistTagsString !== null}
                onChange={(e) => {
                  this.setState({ blacklistTagsString: !e.target.checked ? null : '' })
                }}
              />
            </label>
            {this.state.blacklistTagsString !== null ? (
              <>
                <br />
                <br />
                <label>
                  <span>Blacklisted tags</span>
                  <textarea
                    className="PornSetting__textarea"
                    value={this.state.blacklistTagsString}
                    onChange={(e) => {
                      this.setState({ blacklistTagsString: e.target.value })
                    }}
                  ></textarea>
                  <em>
                    Put any tag combinations you don&apos;t want to see. Each combination should go on a separate line. &nbsp;
                    <a href="https://e621.net/help/blacklist">View help</a>.
                  </em>
                  {this.props.credentials != null ? <button onClick={this.loadBlacklist}>Reload user blacklist</button> : null}
                </label>
              </>
            ) : null}
          </div>
          <div className="settings-innerrow">
            <label>
              <span>Score filtering</span>
              <input
                type="checkbox"
                checked={this.state.minScore !== null}
                onChange={(e) => {
                  this.setState({ minScore: !e.target.checked ? null : -10 })
                }}
              />
            </label>
            {this.state.minScore !== null ? (
              <>
                <br />
                <br />
                <label>
                  <span>Minimum score</span>
                  <input
                    type="range"
                    min="-10"
                    max="690"
                    step="1"
                    value={this.state.minScore === null ? 0 : this.state.minScore}
                    onChange={(e) => {
                      this.setState({ minScore: parseInt(e.target.value) })
                    }}
                  />
                </label>
                <span>
                  ≥<strong> {this.state.minScore}</strong>
                </span>
              </>
            ) : null}
          </div>

          <div className="settings-innerrow">
            <label>
              <span>Number to fetch</span>
              <input
                type="range"
                min="1"
                max="150"
                step="1"
                value={this.state.count}
                onChange={(e) => {
                  this.setState({ count: parseInt(e.target.value) })
                }}
              />
            </label>
            <span>
              <strong>{this.state.count}</strong> posts
            </span>
          </div>

          <div className="settings-innerrow">
            <label>
              <span>Fetch in high-res</span>
              <input
                type="checkbox"
                checked={this.state.flags.highRes}
                onChange={(e) => {
                  this.setState({ flags: { highRes: e.target.checked } })
                }}
              />
              <i className="emoji-icon">{this.state.flags.highRes ? '🦄' : '🐴'}</i>
            </label>
          </div>

          {this.props.pornList.length > 0 ? (
            <div className="settings-innerrow PornSetting__count-row">
              <button onClick={this.clear}>Clear All</button>
              <span>
                <strong>{this.props.pornList.length} items</strong> stored. Click thumbnail to delete.
              </span>
              <div className="PornSetting__thumbnails">
                {this.props.pornList.map((porn) => (
                  <PornThumbnail key={porn} image={porn} onDelete={this.clearOne.bind(this)} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </fieldset>
    )
  }
}
