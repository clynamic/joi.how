import React, { useCallback, useEffect, useState, type FunctionComponent } from 'react'
import { type ArrayElement, type PornList } from '../types'

import { type IState } from '../../../store'

import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SettingsActions } from '../../settings/store'
import './Porn.css'
import { PornControls } from './PornControls/PornControls'
import { Walltaker } from './Walltaker'

const PornBackgroundDiv = styled.div`
  ${(props: { duration: number }) => `
    animation-duration: ${props.duration}ms !important;
  `}
`

export const Porn: FunctionComponent = () => {
  const pornList = useSelector<IState, IState['settings']['pornList']>((state) => state.settings.pornList)
  const walltakerLink = useSelector<IState, IState['settings']['walltakerLink']>((state) => state.settings.walltakerLink)
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const [currentPornKey, setCurrentPornKey] = useState(0)
  const [playing, setPlaying] = useState<number | null>(null)
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()

  const openSource = (porn: ArrayElement<PornList>): void => {
    const md5Match = /\w*(?=\.(jpg|gif|webm|png|swf|bmp))/.exec(porn)
    if (md5Match?.[0] != null) {
      window.open(`https://e621.net/post/index/1/md5:${md5Match[0]}`)
    }
  }

  const makePornStyle = (porn: PornList[keyof PornList]): React.CSSProperties => {
    return {
      backgroundImage: `url(${String(porn)})`,
    }
  }

  const skipPorn = (pornToSkip: number): void => {
    dispatch(SettingsActions.SetPornList(pornList.filter((porn) => porn !== pornList[pornToSkip])))
    setCurrentPornKey(Math.floor(pornList.length * Math.random()))
  }

  const nextPorn = useCallback((): void => {
    setTimeout(() => {
      setPlaying(null)
      setCurrentPornKey(Math.floor(pornList.length * Math.random()))
      nextPorn()
    }, Math.max((100 - intensity) * 80, 400))
  }, [intensity, pornList.length])

  useEffect(() => {
    nextPorn()
  }, [nextPorn])

  useEffect(() => {
    if (playing === null) {
      const duration = Math.max((100 - intensity) * 80, 800)
      setPlaying(duration)
    }
  }, [playing, intensity])

  return (
    <div className="Porn__container">
      <Walltaker walltakerLink={walltakerLink} pornList={pornList} dispatch={dispatch} />
      {pornList.length > 0 ? (
        <>
          <div className="Porn">
            <div className="Porn__foreground" style={makePornStyle(pornList[currentPornKey])} />
            <PornBackgroundDiv
              duration={playing ?? 0}
              className="Porn__background"
              style={makePornStyle(pornList[currentPornKey])}
            ></PornBackgroundDiv>
          </div>
          <PornControls
            onSkip={() => {
              skipPorn(currentPornKey)
            }}
            onOpen={() => {
              openSource(pornList[currentPornKey])
            }}
          />
        </>
      ) : null}
    </div>
  )
}
