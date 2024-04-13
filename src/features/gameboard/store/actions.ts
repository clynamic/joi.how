import { createAsyncThunk } from '@reduxjs/toolkit'
import { gameBoardSlice } from './reducer'

const StartGame = createAsyncThunk('gameBoard/startGame', async (_, { dispatch }) => {
  dispatch(gameBoardSlice.actions.ClearTimers())
  dispatch(gameBoardSlice.actions.StartGame())
})

const StopGame = createAsyncThunk('gameBoard/stopGame', async (_, { dispatch }) => {
  dispatch(gameBoardSlice.actions.ClearTimers())
  dispatch(gameBoardSlice.actions.StopGame())
})

const SetPace = createAsyncThunk('gameBoard/setPaceAndIntensity', async (newPace: number, { dispatch }) => {
  dispatch(gameBoardSlice.actions.SetPace(newPace))

  if (newPace > 9) {
    dispatch(gameBoardSlice.actions.IncIntensity(8))
  } else if (newPace > 8) {
    dispatch(gameBoardSlice.actions.IncIntensity(4))
  } else if (newPace > 7) {
    dispatch(gameBoardSlice.actions.IncIntensity(2))
  } else if (newPace > 6) {
    dispatch(gameBoardSlice.actions.IncIntensity(1))
  } else if (newPace < 3) {
    dispatch(gameBoardSlice.actions.DecIntensity(1))
  } else if (newPace < 2) {
    dispatch(gameBoardSlice.actions.DecIntensity(2))
  } else if (newPace < 1) {
    dispatch(gameBoardSlice.actions.DecIntensity(12))
  } else if (newPace < 0.5) {
    dispatch(gameBoardSlice.actions.DecIntensity(18))
  }
})

export const GameBoardActions = {
  ...gameBoardSlice.actions,
  SetPace,
  StartGame,
  StopGame,
}

export type GameBoardAction = (typeof GameBoardActions)[keyof typeof GameBoardActions]

export const GameBoardReducer = gameBoardSlice.reducer
