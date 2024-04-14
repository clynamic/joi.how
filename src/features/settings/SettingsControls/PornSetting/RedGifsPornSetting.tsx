import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { FunctionComponent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { PornService, PornType, type PornList } from '../../../gameboard/types'
import type { RedGifsSearchResponse } from '../../types';
import { RedGifsSexuality, RedGifsSortOrder } from '../../types'
import '../settings.css'
import './PornSetting.css'
import { type IPornSettingProps } from './PornSetting'

interface IRedGifsPornSettingProps extends IPornSettingProps {}

export const RedGifsPornSetting: FunctionComponent<IRedGifsPornSettingProps> = (props) => {
  const [authToken, setAuthToken] = useState<string | undefined>(props.credentials?.[PornService.REDGIFS]?.authToken)
  const [search, setSearch] = useState<string>('')
  const [count, setCount] = useState(30)
  const [sortOrder, setSortOrder] = useState<RedGifsSortOrder>(RedGifsSortOrder.BEST)
  const [sexualityPreference, setSexualityPreference] = useState<RedGifsSexuality>(RedGifsSexuality.ANY)

  useEffect(() => {
    if (!authToken && props.credentials?.[PornService.REDGIFS] != null) {
      setAuthToken(props.credentials[PornService.REDGIFS].authToken)
    }
  }, [setAuthToken, props.credentials, authToken])

  const clearCredentials = useCallback(() => {
    setAuthToken(undefined)
    props.setCredentials(PornService.REDGIFS, undefined)
  }, [props])

  const generateCredentials = useCallback(() => {
    clearCredentials();

    const config: AxiosRequestConfig = {
      responseType: 'json',
    }
    axios
      .get(`https://api.redgifs.com/v2/auth/temporary`, config)
      .then((response: AxiosResponse<{ token: string }>) => {
        setAuthToken(response.data.token);
        props.setCredentials(PornService.REDGIFS, { authToken: response.data.token });
      })
      .catch(() => {
        return Promise.reject();
      })
  }, [clearCredentials, props])

  const saveCredentials = useCallback(() => {
    if (authToken == null) {
      return;
    }
    props.setCredentials(PornService.REDGIFS, { authToken });
  }, [authToken, props])

  const updateAuthToken = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAuthToken(event.target.value)
    },
    [],
  )

  const updateSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value)
    },
    [setSearch],
  )

  const updateCount = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCount(parseInt(event.target.value))
    },
    [setCount],
  )

  const updateSexualityPreference = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSexualityPreference(event.target.value as RedGifsSexuality)
    },
    [setSexualityPreference],
  )

  const updateSortOrder = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSortOrder(event.target.value as RedGifsSortOrder)
    },
    [setSortOrder],
  )

  const downloadFromRedGifs = useCallback((cumTo: boolean) => {
    if (!authToken) {
      return;
    }

    const config: AxiosRequestConfig = {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'json',
    }
    void axios
      .get(`https://cors-proxy.fringe.zone/api.redgifs.com/v2/gifs/search?order=${sortOrder}&count=${count}&page=1&type=g&search_text=${search}`, config)
      .then((response: AxiosResponse<RedGifsSearchResponse>) => {
        const pornList = cumTo ? props.pornToCumTo : props.porn
        const pornItems = (
          response.data.gifs
            .filter(({sexuality}) => !sexuality || sexuality.includes(sexualityPreference) || sexualityPreference === RedGifsSexuality.ANY)
            .map((gif) => ({
              previewUrl: gif.urls.thumbnail,
              hoverPreviewUrl: gif.urls.vthumbnail,
              mainUrl: gif.urls.sd,
              highResUrl: gif.urls.hd,
              type: PornType.VIDEO,
              source: `https://www.redgifs.com/watch/${gif.id}`,
              service: PornService.REDGIFS,
              uniqueId: gif.id
            }))
            .filter(({mainUrl}) => mainUrl !== null) as PornList
        )
          .filter(({service, uniqueId}) => !pornList.find((item) => item.service === service && item.uniqueId === uniqueId));

          const newPornList = [...pornList, ...pornItems];

          if (cumTo) {
            props.setPornToCumTo(newPornList)
          } else {
            props.setPorn(newPornList)
          }
      }).catch((err) => {
        console.error(err);
        // likely auth failed, so clear credentials
        clearCredentials();
      })
  }, [authToken, sortOrder, count, search, props, sexualityPreference, clearCredentials])

  return (
    <div className="settings-row">
      <div className="settings-innerrow">
        <label>
          <span>Search query</span>
          <input type="text" value={search} onChange={updateSearch} />
        </label>
        <button onClick={() => downloadFromRedGifs(false)}>Download videos/gifs</button>
        <button onClick={() => downloadFromRedGifs(true)}>Download videos/gifs (For Cumming)</button>
      </div>

      <div className="settings-innerrow">
        <label>
          <span>Credentials (auto generated)</span>
          <input type="text" value={authToken ?? ""} onChange={updateAuthToken} />
          <button onClick={() => generateCredentials()}>Generate</button>
          <button onClick={() => saveCredentials()}>Save</button>
        </label>
      </div>

      <div className="settings-innerrow">
        <label>
          <span>Sexuality</span>
          <select onChange={updateSexualityPreference}>
            <option value={RedGifsSexuality.ANY} selected={sexualityPreference === RedGifsSexuality.ANY}>Any</option>
            <option value={RedGifsSexuality.STRAIGHT} selected={sexualityPreference === RedGifsSexuality.STRAIGHT}>Stright</option>
            <option value={RedGifsSexuality.GAY} selected={sexualityPreference === RedGifsSexuality.GAY}>Gay</option>
            <option value={RedGifsSexuality.TRANS} selected={sexualityPreference === RedGifsSexuality.TRANS}>Trans</option>
            <option value={RedGifsSexuality.LESBIAN} selected={sexualityPreference === RedGifsSexuality.LESBIAN}>Lesbian</option>
            <option value={RedGifsSexuality.BISEXUAL} selected={sexualityPreference === RedGifsSexuality.BISEXUAL}>Bisexual</option>
          </select>
        </label>
      </div>

      <div className="settings-innerrow">
        <label>
          <span>Sort order</span>
          <select onChange={updateSortOrder}>
            <option value={RedGifsSortOrder.BEST} selected={sortOrder === RedGifsSortOrder.BEST}>Top (All Time)</option>
            <option value={RedGifsSortOrder.TOP28} selected={sortOrder === RedGifsSortOrder.TOP28}>Top (Month)</option>
            <option value={RedGifsSortOrder.TOP7} selected={sortOrder === RedGifsSortOrder.TOP7}>Top (Week)</option>
            <option value={RedGifsSortOrder.LATEST} selected={sortOrder === RedGifsSortOrder.LATEST}>Latest</option>
            <option value={RedGifsSortOrder.OLDEST} selected={sortOrder === RedGifsSortOrder.OLDEST}>Oldest</option>
            <option value={RedGifsSortOrder.TRENDING} selected={sortOrder === RedGifsSortOrder.TRENDING}>Trending</option>
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
    </div>
  )
}
