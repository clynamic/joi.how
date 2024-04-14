import { useEffect, useState, type FunctionComponent } from 'react'
import { MessageType } from '../MessageArea/MessageTypes'
import { SettingsActions } from '../../settings/store'
import axios, { type AxiosResponse } from 'axios'
import { PornService, PornType } from '../types'
import { type IState } from '../../../store'
import { GameBoardActions } from '../store'

interface IWalltakerProps {
  walltakerLink: IState['settings']['walltaker']
  pornList: IState['settings']['porn']
  dispatch: (action: unknown) => void
}

interface IWalltakerLink {
  id: number
  expires: string
  user_id: number
  terms: string
  blacklist: string
  post_url: string
  post_thumbnail_url: string
  post_description: string
  created_at: string
  updated_at: string
  set_by: string
  url: string
}

const PING_EVERY = 8000

export const Walltaker: FunctionComponent<IWalltakerProps> = (props) => {
  const { walltakerLink, pornList, dispatch } = props
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (intervalId != null) clearInterval(intervalId)
    if (walltakerLink != null) {
      setIntervalId(
        setInterval(() => {
          void axios
            .get(`https://walltaker.joi.how/links/${walltakerLink}.json`, {
              responseType: 'json',
              headers: {
                joihow: 'joihow/web',
              },
            })
            .then((response: AxiosResponse<IWalltakerLink>) => {
              if (
                response.data.post_url != null &&
                !pornList.some(({ mainUrl, highResUrl }) => [mainUrl, highResUrl].includes(response.data.post_url))
              ) {
                dispatch(
                  SettingsActions.SetPornList([
                    ...pornList,
                    {
                      previewUrl: response.data.post_thumbnail_url,
                      hoverPreviewUrl: response.data.post_thumbnail_url,
                      mainUrl: response.data.post_url,
                      highResUrl: response.data.post_url,
                      service: PornService.WALLTAKER,
                      type: PornType.IMAGE,
                      uniqueId: String(response.data.id),
                      source: `https://e621.net/post/index/1/md5:${response.data.post_thumbnail_url.split('/').pop()?.split('.')?.[0]}`,
                    },
                  ]),
                )
                dispatch(
                  GameBoardActions.ShowMessage({
                    type: MessageType.EventDescription,
                    text: `${response.data.set_by ?? 'anon'} added a new image.`,
                  }),
                )
              }
            })
        }, PING_EVERY),
      )
    }

    return () => {
      if (intervalId != null) clearInterval(intervalId)
    }
  }, [intervalId, walltakerLink, pornList, dispatch])

  return <></>
}
