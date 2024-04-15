import { EmergencyStop } from './EmergencyStop/EmergencyStop'
import { Action, type ThunkDispatch } from '@reduxjs/toolkit'
import { useEffect, type FunctionComponent } from 'react'
import { MessageType } from './MessageArea/MessageTypes'
import { MessageArea } from './MessageArea/MessageArea'
import { StrokeMeter } from './StrokeMeter/StrokeMeter'
import { VibrationStyleMode } from '../settings/store'
import { useDispatch, useSelector } from 'react-redux'
import { getNextEvent } from './store/actions.events'
import { useGameLoop } from './store/hooks'
import { GameBoardActions } from './store'
import { type IState } from '../../store'
import { Stats } from './Stats/Stats'
import { Hypno } from './Hypno/Hypno'
import { Porn } from './Porn/Porn'
import { playTone } from './sound'
import { EStroke } from './types'
import './GameBoard.css'

export const GameBoard: FunctionComponent = () => {
  const state = useSelector((state: IState) => state)

  const pornListLength = useSelector<IState, number>((state) => state.settings.porn.length)
  const stroke = useSelector<IState, IState['game']['stroke']>((state) => state.game.stroke)
  const pace = useSelector<IState, IState['game']['pace']>((state) => state.game.pace)
  const cumming = useSelector<IState, IState['game']['cumming']>((state) => state.game.cumming)
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const inWarmup = useSelector<IState, IState['game']['inWarmup']>((state) => state.game.inWarmup)
  const vibrators = useSelector<IState, IState['vibrators']>((state) => state.vibrators)
  const hypno = useSelector<IState, IState['settings']['hypno']>((state) => state.settings.hypno)
  const warmupDuration = useSelector<IState, IState['settings']['warmupDuration']>((state) => state.settings.warmupDuration)
  const duration = useSelector<IState, IState['settings']['duration']>((state) => state.settings.duration)

  const dispatch: ThunkDispatch<IState, unknown, Action> = useDispatch()

  useEffect(() => {
    if (warmupDuration === 0) {
      void dispatch(GameBoardActions.StartGame())
      return
    }

    void dispatch(GameBoardActions.StartWarmup())

    const warmupTimeout = setTimeout(() => {
      void dispatch(GameBoardActions.StartGame())
    }, warmupDuration * 100)

    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.Prompt,
        text: `Look at all this porn, get yourself ready!`,
        buttons: [
          {
            display: `I'm ready $master`,
            method: () => {
              clearTimeout(warmupTimeout)
              dispatch(GameBoardActions.StartGame())
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: 'Now follow what I say $player.',
                }),
              )
            },
          },
        ],
      }),
    )

    return () => {
      void dispatch(GameBoardActions.StopGame())
      clearTimeout(warmupTimeout)
    }
  }, [dispatch, pornListLength, warmupDuration])

  useGameLoop(
    () => {
      dispatch(GameBoardActions.Pulse())
      if (stroke === EStroke.down) playTone(425)
      if (stroke === EStroke.up) {
        playTone(625)
        if (vibrators.devices.length > 0) {
          if (vibrators.mode === VibrationStyleMode.THUMP && pace <= 3) {
            vibrators.devices.forEach((e) => {
              void e.thump(((1 / pace) * 1000) / 2, Math.max(0.25, intensity / 100))
            })
          } else {
            vibrators.devices.forEach((e) => {
              void e.setVibration(intensity / 100)
            })
          }
        }
      }
    },
    (1 / pace) * 1000,
  )

  useGameLoop(async () => {
    const next = getNextEvent(state)
    if (next != null) {
      await dispatch(next)
    }
  }, 1000)

  useGameLoop(() => {
    dispatch(GameBoardActions.IncIntensity(1))
  }, duration)

  return (
    <div className="GameBoard">
      <Stats />
      <StrokeMeter stroke={stroke} pace={pace} cumming={cumming} />
      <Hypno mode={hypno} />
      <MessageArea />
      <EmergencyStop />
      <Porn />
    </div>
  )
}
