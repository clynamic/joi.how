import { createAsyncThunk } from '@reduxjs/toolkit'
import { wait } from '../../../../../helpers/helpers'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { gameBoardSlice } from '../../reducer'

export const Pause = createAsyncThunk('gameBoard/event-pause', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  const duration = Math.ceil(-100 * state.game.intensity + 12000)
  dispatch(gameBoardSlice.actions.SetVibration(0))
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Stop stroking!`,
    }),
  )
  dispatch(gameBoardSlice.actions.PauseGame())

  await wait(duration)

  dispatch(gameBoardSlice.actions.SetVibration(state.game.pace / state.settings.pace.max))
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Start stroking again.`,
    }),
  )
  dispatch(gameBoardSlice.actions.ResumeGame())
})
