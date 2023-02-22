import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import StrokeMeter from './StrokeMeter/StrokeMeter'
import { IState } from '../../store'
import { GameBoardActions } from './store'
import { MessageArea } from './MessageArea/MessageArea'
import { EmergencyStop } from './EmergencyStop/EmergencyStop'
import { Stats } from './Stats/Stats'
import { Porn } from './Porn/Porn'

import './GameBoard.css'
import { Hypno } from './Hypno/Hypno'
import { ThunkDispatch, AnyAction } from '@reduxjs/toolkit'

export const GameBoard: React.FC<{}> = () => {
  const state = useSelector((state: IState) => state)
  const dispatch: ThunkDispatch<IState, any, AnyAction> = useDispatch()

  useEffect(() => {
    if (state.game.gamePaused) {
      dispatch(GameBoardActions.StopGame())
    } else {
      dispatch(GameBoardActions.StartGame())
    }
    return () => {
      dispatch(GameBoardActions.StopGame())
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
