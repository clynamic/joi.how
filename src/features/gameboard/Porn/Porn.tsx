import { useCallback, useMemo, type FunctionComponent } from 'react'
import { type ArrayElement, type PornList } from '../types'

import { type IState } from '../../../store'

import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SettingsActions } from '../../settings/store'
import { GameBoardActions } from '../store'
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
  const currentImage = useSelector<IState, IState['game']['currentImage']>((state) => state.game.currentImage)
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()

  const openSource = useCallback((porn: ArrayElement<PornList>): void => {
    const md5Match = /\w*(?=\.(jpg|gif|webm|png|swf|bmp))/.exec(porn)
    if (md5Match?.[0] != null) {
      window.open(`https://e621.net/post/index/1/md5:${md5Match[0]}`)
    }
  }, [])

  const pornImage = useMemo(() => {
    return {
      backgroundImage: `url(${pornList[currentImage]})`,
    }
  }, [currentImage, pornList])

  const skipPorn = useCallback(
    (pornToSkip: number) => {
      dispatch(SettingsActions.SetPornList(pornList.filter((porn) => porn !== pornList[pornToSkip])))
      dispatch(GameBoardActions.SetImage(Math.floor(pornList.length * Math.random())))
    },
    [dispatch, pornList],
  )

  const pulseDuration = useMemo(() => {
    return Math.max((100 - intensity) * 80, 400)
  }, [intensity])

  return (
    <div className="Porn__container">
      <Walltaker walltakerLink={walltakerLink} pornList={pornList} dispatch={dispatch} />
      {pornList.length > 0 ? (
        <>
          <div className="Porn">
            <div className="Porn__foreground" style={pornImage} />
            <PornBackgroundDiv duration={pulseDuration} className="Porn__background" style={pornImage}></PornBackgroundDiv>
          </div>
          <PornControls
            onSkip={() => {
              skipPorn(currentImage)
            }}
            onOpen={() => {
              openSource(pornList[currentImage])
            }}
          />
        </>
      ) : null}
    </div>
  )
}
