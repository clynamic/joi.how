import { EStroke, EGrip } from '../types'
import { Message, applyMessage } from '../MessageArea/MessageTypes'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IState } from '../../../store'
import { VibrationStyleMode } from '../../settings/store'
import { randomPace } from '../events/event-definitions/pace/randomPace'
import { getNextEvent } from '../events'
import { playTone } from '../sound'

export interface IGameBoardState {
  pace: number
  grip: EGrip
  intensity: number
  messages: Message[]
  timers: NodeJS.Timeout[]
  stroke: EStroke
  eventsPaused: boolean
  gamePaused: boolean
  vibration: number
  cumming: boolean
}

const StartGame = createAsyncThunk('gameBoard/startGame', async (_, { getState, dispatch }) => {
  const gameloop = (callback: () => void | Promise<void>, ms: (state: IState) => number | undefined) => {
    const state = getState() as IState
    const timer = setTimeout(async () => {
      if (window.location.pathname !== '/play') return
      if (!state.game.gamePaused) {
        await callback()
      }
      dispatch(gameBoardSlice.actions.SetTimers(state.game.timers.filter((e) => e !== timer)))
      if (!state.game.gamePaused) {
        gameloop(callback, ms)
      }
    }, ms(state) || 0)
    dispatch(gameBoardSlice.actions.SetTimers(state.game.timers.concat([timer])))
  }

  randomPace(undefined)(getState() as IState, dispatch)
  gameloop(
    () => {
      const state = getState() as IState
      dispatch(GameBoardActions.Pulse())
      if (state.game.stroke === EStroke.down) playTone(425)
      if (state.game.stroke === EStroke.up) {
        playTone(625)
        if (state.vibrators.devices.length > 0 && state.vibrators.mode === VibrationStyleMode.THUMP) {
          if (state.game.pace > 3.25) {
            state.vibrators.devices.forEach((e) => e.setVibration(state.game.intensity / 100))
          } else
            state.vibrators.devices.forEach((e) => e.thump(((1 / state.game.pace) * 1000) / 2, Math.max(0.25, state.game.intensity / 100)))
        }
      }
    },
    (state) => (1 / state.game.pace) * 1000,
  )
  gameloop(
    async () => {
      const state = getState() as IState
      const next = getNextEvent(state)
      if (next) {
        await next(state, dispatch)
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
  state.game.timers.forEach((timer) => clearTimeout(timer))
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
      state.vibrators.devices.forEach((e) =>
        e.setVibration(percentage).catch((_) => {
          dispatch(gameBoardSlice.actions.SetVibration(state.game.vibration))
        }),
      )
    }
    dispatch(gameBoardSlice.actions.SetVibration(percentage))
  }
})

const gameBoardSlice = createSlice({
  name: 'gameboard',
  initialState: {
    pace: 1,
    grip: EGrip.right,
    intensity: 0,
    messages: [],
    timers: [],
    stroke: EStroke.down,
    eventsPaused: false,
    gamePaused: false,
    cumming: false,
    vibration: 0,
  } as IGameBoardState,
  reducers: {
    SetPace: (state, action: PayloadAction<number>) => {
      state.pace = action.payload
    },
    IncIntensity: (state, action: PayloadAction<number>) => {
      state.intensity = Math.min(state.intensity + action.payload, 100)
    },
    DecIntensity: (state, action: PayloadAction<number>) => {
      state.intensity = Math.max(state.intensity - action.payload, 0)
    },
    SetGrip: (state, action: PayloadAction<EGrip>) => {
      state.grip = action.payload
    },
    ShowMessage: (state, action: PayloadAction<Message>) => {
      state.messages = applyMessage(state.messages, action.payload)
    },
    Pulse: (state) => {
      state.stroke = state.stroke === EStroke.down ? EStroke.up : EStroke.down
    },
    PauseEvents: (state) => {
      state.eventsPaused = true
    },
    ResumeEvents: (state) => {
      state.eventsPaused = false
    },
    PauseGame: (state) => {
      state.gamePaused = true
    },
    ResumeGame: (state) => {
      state.gamePaused = false
    },
    SetTimers: (state, action: PayloadAction<NodeJS.Timeout[]>) => {
      state.timers = action.payload
    },
    SetVibration: (state, action: PayloadAction<number>) => {
      state.vibration = action.payload
    },
    Cum: (state) => {
      state.cumming = true
    },
  },
})

export const GameBoardActions = {
  ...gameBoardSlice.actions,
  SetPace,
  SetVibration,
  StartGame,
  StopGame,
}

export type GameBoardAction = typeof GameBoardActions[keyof typeof GameBoardActions]

export const GameBoardReducer = gameBoardSlice.reducer
