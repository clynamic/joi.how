import React from 'react'
import '../settings.css'
import './PornSetting.css'
import { PornList } from '../../../gameboard/types'
import { E621Posts } from '../../types'
import axios, { AxiosResponse } from 'axios'
import { PornThumbnail } from './PornThumbnail'
import { debounce } from 'lodash'
import reactGA from '../../../../analytics'

interface IPornSettingProps {
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
    }
    this.updateTags = this.updateTags.bind(this)
    this.downloadFromTags = this.downloadFromTags.bind(this)
    this.clear = this.clear.bind(this)
  }

  updateTags(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      tags: event.target.value,
    })
  }

  downloadFromTags() {
    debounce(() => {
      if (localStorage.getItem('allowCookies') !== 'true' || localStorage.getItem('allowCookies') !== null) return
      reactGA.event({
        category: 'Tags',
        action: `Changed tags`,
        label: this.state.tags,
      })
    }, 2000)()
    const tags = encodeURIComponent(this.state.tags + (this.state.minScore !== null ? ` score:>=${this.state.minScore}` : ''))
    axios
      .get(`https://e621.net/posts.json?tags=${tags}&limit=${this.state.count}&callback=callback`, {
        responseType: 'json',
      })
      .then((response: AxiosResponse<{ posts: E621Posts }>) => {
        this.props.setPornList(
          (
            response.data.posts
              .filter((post) => /(jpg|png|bmp|jpeg|webp|gif)$/g.test(post.file.ext))
              .map((post) => (this.state.flags.highRes ? post.file.url : post.sample.url))
              .filter((url) => url !== null) as string[]
          )
            .filter((url) => this.props.pornList.indexOf(url) === -1)
            .concat(this.props.pornList),
        )
      })
  }

  clear() {
    this.props.setPornList([])
  }

  clearOne(image: string) {
    this.props.setPornList(this.props.pornList.filter((porn) => porn !== image))
  }

  render() {
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
            <label>
              <span>Score filtering</span>
              <input
                type="checkbox"
                checked={this.state.minScore !== null}
                onChange={(e) => this.setState({ minScore: !e.target.checked ? null : -10 })}
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
                    onChange={(e) => this.setState({ minScore: parseInt(e.target.value) })}
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
                onChange={(e) => this.setState({ count: parseInt(e.target.value) })}
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
                onChange={(e) => this.setState({ flags: { highRes: e.target.checked } })}
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
