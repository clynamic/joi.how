import axios, { type AxiosResponse } from 'axios'
import { useEffect, useState, type FunctionComponent } from 'react'
import { type IState } from '../../../store'
import { SettingsActions } from '../../settings/store'
import { MessageType } from '../MessageArea/MessageTypes'
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
              if (response.data.post_url != null && !pornList.includes(response.data.post_url)) {
                dispatch(SettingsActions.SetPornList([...pornList, response.data.post_url]))
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
