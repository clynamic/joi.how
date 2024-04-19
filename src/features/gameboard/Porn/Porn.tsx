import { PornQuality, PornType, type ArrayElement, type PornList } from '../types'
import { useCallback, useMemo, useRef, type FunctionComponent } from 'react'
import { type Action, type ThunkDispatch } from '@reduxjs/toolkit'
import { PornControls } from './PornControls/PornControls'
import { SettingsActions } from '../../settings/store'
import { useDispatch, useSelector } from 'react-redux'
import { useGameLoop } from '../store/hooks'
import { GameBoardActions } from '../store'
import { styled } from 'styled-components'
import { IState } from '../../../store'
import { Walltaker } from './Walltaker'
import './Porn.css'

const PornBackgroundDiv = styled.div<{ duration: number }>`
  ${({ duration }) => `
    animation-duration: ${duration}ms !important;
  `}
`

export const Porn: FunctionComponent = () => {
  const pornList = useSelector<IState, IState['settings']['porn']>((state) => state.settings.porn)
  const pornQuality = useSelector<IState, IState['settings']['pornQuality']>((state) => state.settings.pornQuality)
  const startVideosAtRandomTime = useSelector<IState, IState['settings']['startVideosAtRandomTime']>(
    (state) => state.settings.startVideosAtRandomTime,
  )
  const videosMuted = useSelector<IState, IState['settings']['videosMuted']>((state) => state.settings.videosMuted)
  const walltakerLink = useSelector<IState, IState['settings']['walltaker']>((state) => state.settings.walltaker)
  const currentImage = useSelector<IState, IState['game']['currentImage']>((state) => state.game.currentImage)
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const dispatch: ThunkDispatch<IState, unknown, Action> = useDispatch()
  const videoRef = useRef<HTMLVideoElement>(null)

  const openSource = useCallback((porn: ArrayElement<PornList>): void => {
    window.open(porn.source)
  }, [])

  const pornItem = useMemo(() => {
    return pornList[currentImage]
  }, [currentImage, pornList])

  const pornImage = useMemo(() => {
    if (!pornItem) {
      return {}
    }

    return {
      backgroundImage: `url(${
        pornItem.type === PornType.VIDEO ? pornItem.previewUrl : pornQuality === PornQuality.HIGH ? pornItem.highResUrl : pornItem.mainUrl
      })`,
    }
  }, [pornItem, pornQuality])

  const skipPorn = useCallback(
    (pornToSkip: number) => {
      dispatch(
        SettingsActions.SetPornList(
          pornList.filter(
            ({ service, uniqueId }) =>
              service !== pornList[pornToSkip].service ||
              (service === pornList[pornToSkip].service && uniqueId !== pornList[pornToSkip].uniqueId),
          ),
        ),
      )
      dispatch(GameBoardActions.SetImage(Math.floor(pornList.length * Math.random())))
    },
    [dispatch, pornList],
  )

  const pulseDuration = useMemo(() => {
    return Math.max((100 - intensity) * 80, 800)
  }, [intensity])

  useGameLoop(
    () => {
      dispatch(GameBoardActions.SetImage(Math.floor(pornList.length * Math.random())))
    },
    Math.max((100 - intensity) * 80, 400),
    () => false, // images never pause
  )

  return (
    <div className="Porn__container">
      <Walltaker walltakerLink={walltakerLink} pornList={pornList} dispatch={dispatch} />
      {pornList.length > 0 ? (
        <>
          <div className="Porn">
            <div className="Porn__foreground" style={pornItem.type === PornType.VIDEO ? undefined : pornImage}>
              {pornItem.type === PornType.VIDEO && (
                <video
                  ref={videoRef}
                  src={pornQuality === PornQuality.HIGH ? pornItem.highResUrl : pornItem.mainUrl}
                  autoPlay={true}
                  loop={true}
                  muted={videosMuted}
                  onLoadedMetadata={(metadata) => {
                    if (startVideosAtRandomTime && videoRef?.current) {
                      videoRef.current.currentTime = Math.floor(Math.random() * metadata.currentTarget.duration)
                    }
                  }}
                />
              )}
            </div>

            <PornBackgroundDiv duration={pulseDuration} className="Porn__background" style={pornImage} />
          </div>
          <PornControls
            onSkip={() => {
              skipPorn(currentImage)
            }}
            onOpen={
              pornList[currentImage]
                ? () => {
                    openSource(pornList[currentImage])
                  }
                : undefined
            }
          />
        </>
      ) : null}
    </div>
  )
}
