import React, { useEffect, useState } from 'react'
import { PropsForConnectedComponent } from '../../settings/types'
import { IState } from '../../../store'
import axios, { AxiosResponse } from 'axios'
import { SettingsActions } from '../../settings/store'

interface IWalltakerProps extends PropsForConnectedComponent {
  walltakerLink: IState['settings']['walltakerLink']
  pornList: IState['settings']['pornList']
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

export function Walltaker(props: IWalltakerProps) {
  const [intervalId, setIntervalId] = useState<number | null>(null)
  useEffect(() => {
    if (intervalId !== null) clearInterval(intervalId)
    if (props.walltakerLink) {
      setIntervalId(
        setInterval(() => {
          axios
            .get(`https://walltaker.joi.how/links/${props.walltakerLink}.json`, {
              responseType: 'json',
            })
            .then((response: AxiosResponse<IWalltakerLink>) => {
              props.dispatch(SettingsActions.SetPornList([...props.pornList, response.data.url]))
            })
        }, 10000),
      )
    }

    return () => {
      if (intervalId !== null) clearInterval(intervalId)
    }
  }, [props.walltakerLink])

  return <></>
}
