import { useEffect, type FunctionComponent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { type IState } from '../../store'
import { EmergencyStop } from './EmergencyStop/EmergencyStop'
import { MessageArea } from './MessageArea/MessageArea'
import { Porn } from './Porn/Porn'
import { Stats } from './Stats/Stats'
import { GameBoardActions } from './store'
import { StrokeMeter } from './StrokeMeter/StrokeMeter'

import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import './GameBoard.css'
import { Hypno } from './Hypno/Hypno'

export const GameBoard: FunctionComponent = () => {
  const state = useSelector((state: IState) => state)
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()

  useEffect(() => {
    if (state.game.gamePaused) {
      void dispatch(GameBoardActions.StopGame())
    } else {
      void dispatch(GameBoardActions.StartGame())
    }

    return () => {
      void dispatch(GameBoardActions.StopGame())
    }
  }, [dispatch, state.game.gamePaused])

  return (
    <div className="GameBoard">
      <Stats />
      <StrokeMeter stroke={state.game.stroke} pace={state.game.pace} cumming={state.game.cumming} />
      <Hypno mode={state.settings.hypnoMode} />
      <MessageArea />
      <EmergencyStop />
      <Porn />
    </div>
  )
}
