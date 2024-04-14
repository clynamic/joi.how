import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { FunctionComponent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { PornService, PornType, type PornList } from '../../../gameboard/types'
import { StashSortOrder, type StashFindScenesResponse } from '../../types';
import '../settings.css'
import './PornSetting.css'
import { type IPornSettingProps } from './PornSetting'

interface IStashPornSettingProps extends IPornSettingProps {}

export const StashPornSetting: FunctionComponent<IStashPornSettingProps> = (props) => {
  const [instanceUrl, setInstanceUrl] = useState<string | undefined>(props.credentials?.[PornService.STASH]?.instanceUrl)
  const [apiKey, setApiKey] = useState<string | undefined>(props.credentials?.[PornService.STASH]?.apiKey)
  const [search, setSearch] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<StashSortOrder>(StashSortOrder.DATE_ASC)
  const [count, setCount] = useState(30)

  useEffect(() => {
    if ((!apiKey || !instanceUrl) && props.credentials?.[PornService.STASH]) {
      setInstanceUrl(props.credentials[PornService.STASH].instanceUrl)
      setApiKey(props.credentials[PornService.STASH].apiKey)
    }
  }, [setInstanceUrl, setApiKey, props.credentials, instanceUrl, apiKey])

  const saveCredentials = useCallback(() => {
    if (apiKey == null || instanceUrl == null) {
      return;
    }
    props.setCredentials(PornService.STASH, { instanceUrl, apiKey });
  }, [instanceUrl, apiKey, props])

  const updateInstanceUrl = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInstanceUrl(event.target.value)
    },
    [],
  )

  const updateApiKey = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setApiKey(event.target.value)
    },
    [],
  )

  const updateSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value)
    },
    [setSearch],
  )

  const updateSortOrder = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSortOrder(event.target.value as StashSortOrder)
    },
    [setSortOrder],
  )

  const updateCount = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCount(parseInt(event.target.value))
    },
    [setCount],
  )

  const downloadFromStash = useCallback((cumTo: boolean) => {
    if (!apiKey) {
      return;
    }

    const config: AxiosRequestConfig = {
      headers: { ApiKey: apiKey },
      responseType: 'json',
    }

    const [sort, direction] = sortOrder.split('_') as [string, string]

    const body = {
      "operationName": "FindScenes",
      "variables": {
        "filter": {
          "q": search,
          "page": 1,
          "per_page": count,
          "sort": sort,
          "direction": direction
        },
        "scene_filter": {}
      },
      "query": `query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {
        findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {
          scenes {
            id
            paths {
              screenshot
              preview
              webp
              stream
            }
            files {
              duration
            }
          }
        }
      }`
    }

    const correctedInstanceUrl = instanceUrl?.endsWith('/') ? instanceUrl.slice(0, -1) : instanceUrl
    void axios
      .post(`${correctedInstanceUrl}/graphql`, body, config)
      .then((response: AxiosResponse<StashFindScenesResponse>) => {
        const pornList = cumTo ? props.pornToCumTo : props.porn
        const pornItems = (
          response.data.data.findScenes.scenes
            .map((scene) => ({
              previewUrl: `${scene.paths.screenshot}&apikey=${apiKey}`,
              hoverPreviewUrl: `${scene.paths.preview}?apikey=${apiKey}`,
              mainUrl: scene.paths.stream,
              highResUrl: scene.paths.stream,
              type: PornType.VIDEO,
              source: `${correctedInstanceUrl}/scenes/${scene.id}`,
              service: PornService.STASH,
              uniqueId: String(scene.id)
            })) as PornList
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
      })
  }, [apiKey, sortOrder, search, count, instanceUrl, props])

  return (
    <div className="settings-row">
      <div className="settings-innerrow">
        <label>
          <span>Search query</span>
          <input type="text" value={search} onChange={updateSearch} />
        </label>
        <button onClick={() => downloadFromStash(false)}>Download files</button>
        <button onClick={() => downloadFromStash(true)}>Download files (For Cumming)</button>
      </div>

      <div className="settings-innerrow">
        <label>
          <span>Stash URL</span>
          <input type="text" value={instanceUrl ?? ""} onChange={updateInstanceUrl} />
        </label>
        <label>
          <span>API Key</span>
          <input type="text" value={apiKey ?? ""} onChange={updateApiKey} />
        </label>
        <button onClick={saveCredentials}>Save credentials</button>
      </div>

      <div className="settings-innerrow">
        <label>
          <span>Sort order</span>
          <select onChange={updateSortOrder}>
            <option value={StashSortOrder.DATE_ASC} selected={sortOrder === StashSortOrder.DATE_ASC}>Newest</option>
            <option value={StashSortOrder.DATE_DESC} selected={sortOrder === StashSortOrder.DATE_DESC}>Oldest</option>
            <option value={StashSortOrder.DURATION_ASC} selected={sortOrder === StashSortOrder.DURATION_ASC}>Shortest</option>
            <option value={StashSortOrder.DURATION_DESC} selected={sortOrder === StashSortOrder.DURATION_DESC}>Longest</option>
            <option value={StashSortOrder.RANDOM} selected={sortOrder === StashSortOrder.RANDOM}>Random</option>
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
