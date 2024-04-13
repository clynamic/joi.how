import { useCallback, useMemo, type FunctionComponent } from 'react'
import { PornQuality, PornType, type ArrayElement, type PornList } from '../types'

import { type IState } from '../../../store'

import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SettingsActions } from '../../settings/store'
import { GameBoardActions } from '../store'
import { useGameLoop } from '../store/hooks'
import './Porn.css'
import { PornControls } from './PornControls/PornControls'
import { Walltaker } from './Walltaker'

const PornBackgroundDiv = styled.div`
  ${(props: { duration: number }) => `
    animation-duration: ${props.duration}ms !important;
  `}
`

export const Porn: FunctionComponent = () => {
  const pornList = useSelector<IState, IState['settings']['porn']>((state) => state.game.cumming && state.settings.pornToCumTo.length ? state.settings.pornToCumTo : state.settings.porn)
  const pornQuality = useSelector<IState, IState['settings']['pornQuality']>((state) => state.settings.pornQuality)
  const walltakerLink = useSelector<IState, IState['settings']['walltaker']>((state) => state.settings.walltaker)
  const currentImage = useSelector<IState, IState['game']['currentImage']>((state) => state.game.currentImage)
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()

  const openSource = useCallback((porn: ArrayElement<PornList>): void => {
      window.open(porn.source)
  }, [])

  const pornItem = useMemo(() => {
    console.log(pornList);
    return pornList[currentImage]
  }, [currentImage, pornList])

  const pornImage = useMemo(() => {
    if (!pornItem) {
      return {};
    }

    return {
      backgroundImage: `url(${pornItem.type === PornType.VIDEO ? pornItem.previewUrl : (pornQuality === PornQuality.HIGH ? pornItem.highResUrl : pornItem.mainUrl)})`,
    }
  }, [pornItem, pornQuality])

  const skipPorn = useCallback(
    (pornToSkip: number) => {
      dispatch(SettingsActions.SetPornList(pornList.filter(({service, uniqueId}) => service !== pornList[pornToSkip].service || (service === pornList[pornToSkip].service && uniqueId !== pornList[pornToSkip].uniqueId))))
      dispatch(GameBoardActions.SetImage(Math.floor(pornList.length * Math.random())))
    },
    [dispatch, pornList],
  )

  const pulseDuration = useMemo(() => {
    return Math.max((100 - intensity) * 80, 800)
  }, [intensity])

  useGameLoop(() => {
    dispatch(GameBoardActions.SetImage(Math.floor(pornList.length * Math.random())))
  }, Math.max((100 - intensity) * 80, 400))

  return (
    <div className="Porn__container">
      <Walltaker walltakerLink={walltakerLink} pornList={pornList} dispatch={dispatch} />
      {pornList.length > 0 && !!pornItem ? (
        <>
          <div className="Porn">
            <div className="Porn__foreground" style={pornItem.type === PornType.VIDEO ? undefined : pornImage}>
              {pornItem.type === PornType.VIDEO && <video src={pornQuality === PornQuality.HIGH ? pornItem.highResUrl : pornItem.mainUrl} autoPlay={true} loop={true} />}
            </div>

            <PornBackgroundDiv duration={pulseDuration} className="Porn__background" style={pornImage} />
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
