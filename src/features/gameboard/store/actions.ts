import { createAsyncThunk } from '@reduxjs/toolkit'
import { type IState } from '../../../store'
import { VibrationStyleMode } from '../../settings/store/reducer.vibrator'
import { playTone } from '../sound'
import { EStroke } from '../types'
import { GameEventActions, getNextEvent } from './actions.events'
import { gameBoardSlice } from './reducer'

const StartGame = createAsyncThunk('gameBoard/startGame', async (_, { getState, dispatch }) => {
  const gameloop = (callback: () => void | Promise<void>, ms: (state: IState) => number | undefined): void => {
    const state = getState() as IState
    const timer = setTimeout((): void => {
      void (async () => {
        if (window.location.pathname !== '/play') return
        if (!state.game.gamePaused) {
          await callback()
        }
        dispatch(gameBoardSlice.actions.SetTimers(state.game.timers.filter((e) => e !== timer)))
        if (!state.game.gamePaused) {
          gameloop(callback, ms)
        }
      })()
    }, ms(state) ?? 0)
    dispatch(gameBoardSlice.actions.SetTimers(state.game.timers.concat([timer])))
  }

  dispatch(GameEventActions.RandomPace())
  gameloop(
    () => {
      const state = getState() as IState
      dispatch(GameBoardActions.SetImage(Math.floor(state.settings.pornList.length * Math.random())))
    },
    (state) => Math.max((100 - state.game.intensity) * 80, 400),
  )
  gameloop(
    () => {
      const state = getState() as IState
      dispatch(GameBoardActions.Pulse())
      if (state.game.stroke === EStroke.down) playTone(425)
      if (state.game.stroke === EStroke.up) {
        playTone(625)
        if (state.vibrators.devices.length > 0 && state.vibrators.mode === VibrationStyleMode.THUMP) {
          if (state.game.pace > 3.25) {
            state.vibrators.devices.forEach((e) => {
              void e.setVibration(state.game.intensity / 100)
            })
          } else {
            state.vibrators.devices.forEach((e) => {
              void (() => {
                void e.thump(((1 / state.game.pace) * 1000) / 2, Math.max(0.25, state.game.intensity / 100))
              })()
            })
          }
        }
      }
    },
    (state) => (1 / state.game.pace) * 1000,
  )
  gameloop(
    async () => {
      const state = getState() as IState
      const next = getNextEvent(state)
      if (next != null) {
        await dispatch(next)
      }
    },
    () => 1000,
  )
  gameloop(
    () => {
      dispatch(GameBoardActions.IncIntensity(1))
    },
    (state) => state.settings.duration,
  )
})

const StopGame = createAsyncThunk('gameBoard/stopGame', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  state.game.timers.forEach((timer) => {
    clearTimeout(timer)
  })
  dispatch(gameBoardSlice.actions.SetTimers([]))
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

const SetVibration = createAsyncThunk('gameBoard/setVibration', async (percentage: number, { getState, dispatch }) => {
  const state = getState() as IState
  if (state.vibrators.mode === VibrationStyleMode.CONSTANT) {
    if (state.vibrators.devices.length > 0) {
      state.vibrators.devices.forEach((e) => {
        void (async () => {
          await e.setVibration(percentage).catch(() => {
            dispatch(gameBoardSlice.actions.SetVibration(state.game.vibration))
          })
        })()
      })
    }
    dispatch(gameBoardSlice.actions.SetVibration(percentage))
  }
})

export const GameBoardActions = {
  ...gameBoardSlice.actions,
  SetPace,
  SetVibration,
  StartGame,
  StopGame,
}

export type GameBoardAction = (typeof GameBoardActions)[keyof typeof GameBoardActions]

export const GameBoardReducer = gameBoardSlice.reducer
